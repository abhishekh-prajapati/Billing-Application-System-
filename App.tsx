import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  FlatList,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  StatusBar,
  ActivityIndicator,
  Modal,
  ScrollView,
  Animated,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { parseInput, ParsedItem } from './data/parser';

interface BillItem {
  id: string;
  name: string;
  qty: number;
  price: number;
}

interface InvoiceRecord {
  id: string;
  invoiceNo: string;
  dateCreated: number;
  displayDate: string;
  receiver: string;
  items: BillItem[];
  total: number;
}

const BUSINESS_DETAILS = {
  shopName: 'Auto Electrician',
  address: 'Dr S S Rao Road Marg, Parel, Mumbai, Maharashtra 400012, India',
  phone: '+91 8850157332',
};

const COLORS = {
  primary: '#0F172A',
  accent: '#F97316',
  background: '#020617',
  card: '#1E293B',
  text: '#F8FAFC',
  subtext: '#94A3B8',
  border: '#334155',
  error: '#EF4444',
  success: '#10B981',
  purple: '#8B5CF6',
};

const ONE_MONTH_MS = 30 * 24 * 60 * 60 * 1000;

export default function App() {
  const [activeTab, setActiveTab] = useState<'bill' | 'history'>('bill');

  // Item input state
  const [recentItems, setRecentItems] = useState<string[]>([]);
  const [itemName, setItemName] = useState('');
  const [itemQty, setItemQty] = useState('1');
  const [itemPrice, setItemPrice] = useState('');

  // Invoice metadata
  const [items, setItems] = useState<BillItem[]>([]);
  const [receiverName, setReceiverName] = useState('');
  const [billDate, setBillDate] = useState('');
  const [currentInvoiceNo, setCurrentInvoiceNo] = useState('');

  const [isAdding, setIsAdding] = useState(false);
  const [history, setHistory] = useState<InvoiceRecord[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<InvoiceRecord | null>(null);


  useEffect(() => {
    setBillDate(new Date().toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' }));
    loadData();
  }, []);

  // ─── STORAGE ───────────────────────────────────────────────────────────────
  const loadData = async () => {
    try {
      const savedBill = await AsyncStorage.getItem('@current_bill');
      if (savedBill) setItems(JSON.parse(savedBill));
      const savedReceiver = await AsyncStorage.getItem('@receiver_name');
      if (savedReceiver) setReceiverName(savedReceiver);

      const savedDate = await AsyncStorage.getItem('@bill_date');
      if (savedDate) setBillDate(savedDate);
      const savedNo = await AsyncStorage.getItem('@current_invoice_no');
      if (savedNo) setCurrentInvoiceNo(savedNo);
      else generateNewInvoiceNo();
      const savedHistory = await AsyncStorage.getItem('@invoice_history');
      if (savedHistory) {
        const parsed: InvoiceRecord[] = JSON.parse(savedHistory);
        const now = Date.now();
        const valid = parsed.filter(b => (now - b.dateCreated) < ONE_MONTH_MS);
        if (valid.length !== parsed.length) await AsyncStorage.setItem('@invoice_history', JSON.stringify(valid));
        setHistory(valid.sort((a, b) => b.dateCreated - a.dateCreated));
      }
      const savedRecent = await AsyncStorage.getItem('@recent_items');
      if (savedRecent) setRecentItems(JSON.parse(savedRecent));
    } catch (e) {}
  };

  const saveItems = async (newItems: BillItem[]) => {
    setItems(newItems);
    await AsyncStorage.setItem('@current_bill', JSON.stringify(newItems));
  };

  const saveDetail = async (type: 'receiver' | 'date', value: string) => {
    if (type === 'receiver') { setReceiverName(value); await AsyncStorage.setItem('@receiver_name', value); }
    else { setBillDate(value); await AsyncStorage.setItem('@bill_date', value); }
  };

  const generateNewInvoiceNo = async () => {
    const n = `INV-${Math.floor(Math.random() * 90000) + 10000}`;
    setCurrentInvoiceNo(n);
    await AsyncStorage.setItem('@current_invoice_no', n);
  };

  const addToRecent = async (name: string) => {
    const updated = [name, ...recentItems.filter(r => r !== name)].slice(0, 6);
    setRecentItems(updated);
    await AsyncStorage.setItem('@recent_items', JSON.stringify(updated));
  };

  // ─── UNIFIED ADD ITEM (fuzzy match runs silently in background) ───────────
  const addItemManual = async () => {
    const finalName = itemName.trim();
    const finalPriceStr = itemPrice.trim();
    if (!finalName || !finalPriceStr) {
      Alert.alert('Missing Information', 'Please provide both item name and price.');
      return;
    }
    setIsAdding(true);
    try {
      // 1. Try local fuzzy match first (offline, instant)
      const parsed = parseInput(finalName + ' ' + finalPriceStr);
      let displayName = parsed?.wasMatched ? parsed.name : finalName;

      // 2. If no fuzzy match found, try Google Translate for Hindi/Hinglish
      if (!parsed?.wasMatched) {
        try {
          const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=en&dt=t&q=${encodeURIComponent(finalName)}`;
          const res = await fetch(url);
          if (res.ok) {
            const data = await res.json();
            if (data?.[0]?.[0]?.[0]) displayName = data[0][0][0];
          }
        } catch { /* silent */ }
      }

      displayName = displayName.charAt(0).toUpperCase() + displayName.slice(1);
      const newItem: BillItem = { id: Date.now().toString(), name: displayName, qty: parseInt(itemQty) || 1, price: parseFloat(finalPriceStr) };
      await saveItems([...items, newItem]);
      await addToRecent(displayName);
      setItemName(''); setItemQty('1'); setItemPrice('');
      Keyboard.dismiss();
    } finally { setIsAdding(false); }
  };

  // ─── ITEM EDITING ─────────────────────────────────────────────────────────
  const removeItem = (id: string) => saveItems(items.filter(i => i.id !== id));
  const editItem = (id: string, field: keyof BillItem, value: string) => {
    saveItems(items.map(item => {
      if (item.id !== id) return item;
      if (field === 'qty' || field === 'price') return { ...item, [field]: Number(value) || 0 };
      return { ...item, [field]: value };
    }));
  };

  const calculateTotal = (list: BillItem[] = items) =>
    list.reduce((s, i) => s + i.qty * i.price, 0);

  const clearAll = async () => {
    setItems([]); setReceiverName('');
    setBillDate(new Date().toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' }));
    await AsyncStorage.multiRemove(['@current_bill', '@receiver_name', '@bill_date']);
    generateNewInvoiceNo();
  };

  // ─── PDF ──────────────────────────────────────────────────────────────────
  const buildHTML = (inv: InvoiceRecord) => `
    <html><head><style>
      @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@400;500;600;700&display=swap');
      body{font-family:'Inter',sans-serif;padding:0;margin:0;color:#1E293B;background:#FFF}
      .box{max-width:800px;margin:auto;padding:40px}
      .hdr{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:50px;border-bottom:2px solid #E2E8F0;padding-bottom:30px}
      .hdr h1{font-family:'Space Grotesk',sans-serif;font-size:34px;font-weight:700;color:#0F172A;text-transform:uppercase;margin:0 0 8px}
      .hdr p{color:#64748B;font-size:13px;margin:3px 0}
      .hdr-r{text-align:right}
      .inv-title{font-family:'Space Grotesk',sans-serif;font-size:46px;font-weight:700;color:#F97316;margin:0 0 8px;line-height:1}
      .inv-no{font-size:15px;color:#475569;font-weight:600}
      .inv-date{font-size:13px;color:#64748B;margin-top:3px}
      .info{display:flex;justify-content:space-between;background:#F8FAFC;padding:24px;border-radius:12px;border-left:4px solid #0F172A;margin-bottom:40px}
      .ib h3{margin:0 0 6px;font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#94A3B8;font-weight:600}
      .ib p{margin:0;font-size:14px;color:#1E293B;font-weight:500}
      .vehicle{font-size:12px;color:#64748B;margin-top:4px}
      table{width:100%;border-collapse:collapse;margin-bottom:40px}
      th,td{padding:15px;text-align:left;border-bottom:1px solid #E2E8F0}
      th{background:#0F172A;color:#FFF;font-family:'Space Grotesk',sans-serif;font-weight:600;text-transform:uppercase;font-size:12px;letter-spacing:.5px}
      th:first-child{border-top-left-radius:8px;border-bottom-left-radius:8px}
      th:last-child{border-top-right-radius:8px;border-bottom-right-radius:8px}
      td{font-size:14px;color:#334155}
      .nm{font-weight:600;color:#0F172A}
      .rc{text-align:right} .cc{text-align:center}
      .sumbox{display:flex;justify-content:flex-end;margin-bottom:60px}
      .sum{width:280px;background:#FFF7ED;padding:22px;border-radius:12px;border:1px solid #FFEDD5}
      .sr{display:flex;justify-content:space-between;margin-bottom:10px;font-size:13px;color:#64748B;font-weight:500}
      .st{display:flex;justify-content:space-between;margin-top:14px;padding-top:14px;border-top:2px dashed #FDBA74;font-size:19px;font-weight:700;color:#0F172A;font-family:'Space Grotesk',sans-serif}
      .st .amt{color:#F97316}
      .ftr{text-align:center;border-top:1px solid #E2E8F0;padding-top:28px}
      .ftr h4{margin:0 0 6px;font-size:15px;color:#0F172A;font-family:'Space Grotesk',sans-serif;font-weight:600}
      .ftr p{margin:0;font-size:12px;color:#64748B}
    </style></head><body>
    <div class="box">
      <div class="hdr">
        <div>
          <h1>${BUSINESS_DETAILS.shopName}</h1>
          <p>${BUSINESS_DETAILS.address}</p>
          <p>Phone: ${BUSINESS_DETAILS.phone}</p>
        </div>
        <div class="hdr-r">
          <h2 class="inv-title">INVOICE</h2>
          <div class="inv-no">#${inv.invoiceNo}</div>
        </div>
      </div>
      <div class="info">
        <div class="ib">
          <h3>Billed To</h3>
          <p>${inv.receiver}</p>
        </div>
        <div class="ib" style="text-align:right">
          <h3>Invoice Date</h3>
          <p>${inv.displayDate}</p>
        </div>
      </div>
      <table>
        <thead><tr>
          <th>Item Description</th>
          <th class="cc">QTY</th>
          <th class="rc">Rate (₹)</th>
          <th class="rc">Total (₹)</th>
        </tr></thead>
        <tbody>
          ${inv.items.map(it => `<tr>
            <td class="nm">${it.name}</td>
            <td class="cc">${it.qty}</td>
            <td class="rc">₹${it.price.toFixed(2)}</td>
            <td class="rc"><strong>₹${(it.qty * it.price).toFixed(2)}</strong></td>
          </tr>`).join('')}
        </tbody>
      </table>
      <div class="sumbox"><div class="sum">
        <div class="sr"><span>Subtotal</span><span>₹${inv.total.toFixed(2)}</span></div>
        <div class="sr"><span>Tax (0%)</span><span>₹0.00</span></div>
        <div class="st"><span>Grand Total</span><span class="amt">₹${inv.total.toFixed(2)}</span></div>
      </div></div>
      <div class="ftr">
        <h4>Thank you for choosing ${BUSINESS_DETAILS.shopName}!</h4>
        <p>For queries contact us within 7 days. Computer generated invoice — no signature required.</p>
      </div>
    </div></body></html>`;

  const previewInvoice = async () => {
    if (items.length === 0) { Alert.alert('Empty Bill', 'Add at least one item.'); return; }
    const rec: InvoiceRecord = {
      id: Date.now().toString(),
      invoiceNo: currentInvoiceNo,
      dateCreated: Date.now(),
      displayDate: billDate || new Date().toLocaleDateString('en-IN'),
      receiver: receiverName || 'Walk-in Customer',
      items: [...items],
      total: calculateTotal(),
    };
    let updated = [...history];
    const idx = updated.findIndex(h => h.invoiceNo === currentInvoiceNo);
    if (idx !== -1) updated[idx] = rec; else updated = [rec, ...updated];
    setHistory(updated);
    await AsyncStorage.setItem('@invoice_history', JSON.stringify(updated));
    setSelectedRecord(rec);
  };

  const sharePDF = async (rec: InvoiceRecord) => {
    try {
      const { uri } = await Print.printToFileAsync({ html: buildHTML(rec), base64: false });
      if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
      else Alert.alert('Notice', 'Sharing not available on this device.');
    } catch { Alert.alert('Error', 'Could not export PDF.'); }
  };

  // ─── RENDERERS ────────────────────────────────────────────────────────────
  const renderBillItem = ({ item }: { item: BillItem }) => (
    <View style={styles.itemCard}>
      <View style={{ flex: 2.5, marginRight: 10 }}>
        <Text style={styles.inputLabelSm}>Description</Text>
        <TextInput style={styles.cardInput} value={item.name} onChangeText={v => editItem(item.id, 'name', v)} placeholderTextColor={COLORS.subtext} />
      </View>
      <View style={{ flex: 0.8, marginRight: 10 }}>
        <Text style={styles.inputLabelSm}>Qty</Text>
        <TextInput style={[styles.cardInput, { textAlign: 'center' }]} value={item.qty.toString()} keyboardType="numeric" onChangeText={v => editItem(item.id, 'qty', v.replace(/[^0-9]/g, ''))} />
      </View>
      <View style={{ flex: 1.2, marginRight: 10 }}>
        <Text style={styles.inputLabelSm}>Price</Text>
        <TextInput style={styles.cardInput} value={item.price.toString()} keyboardType="numeric" onChangeText={v => editItem(item.id, 'price', v.replace(/[^0-9.]/g, ''))} />
      </View>
      <TouchableOpacity onPress={() => removeItem(item.id)} style={styles.deleteBtn}>
        <Text style={styles.deleteBtnText}>✕</Text>
      </TouchableOpacity>
    </View>
  );

  const renderHistoryItem = ({ item }: { item: InvoiceRecord }) => (
    <TouchableOpacity style={styles.historyCard} onPress={() => setSelectedRecord(item)}>
      <View style={{ flex: 1 }}>
        <Text style={styles.historyTitle}>{item.receiver}</Text>
        <Text style={styles.historySub}>#{item.invoiceNo} • {new Date(item.dateCreated).toLocaleDateString()}</Text>
        <Text style={styles.historySub}>{item.items.length} Items</Text>
      </View>
      <View style={{ alignItems: 'flex-end', justifyContent: 'center' }}>
        <Text style={styles.historyAmt}>₹{item.total}</Text>
        <Text style={styles.historyViewText}>Tap to view</Text>
      </View>
    </TouchableOpacity>
  );

  // ─── RENDER ──────────────────────────────────────────────────────────────
  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

        {/* Header */}
        <View style={styles.header}>
          {activeTab === 'history' ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
              <TouchableOpacity onPress={() => setActiveTab('bill')} style={styles.backBtn}>
                <Text style={styles.backBtnText}>◀ Back</Text>
              </TouchableOpacity>
              <Text style={[styles.shopName, { marginLeft: 14 }]}>History</Text>
            </View>
          ) : (
            <>
              <View style={{ flex: 1, paddingRight: 10 }}>
                <Text style={styles.shopName} adjustsFontSizeToFit numberOfLines={1}>{BUSINESS_DETAILS.shopName}</Text>
                <Text style={styles.shopSub}>Smart Garage Billing</Text>
              </View>
              <TouchableOpacity style={styles.historyIconBtn} onPress={() => setActiveTab('history')}>
                <Text style={styles.historyIconText}>📜</Text>
                {history.length > 0 && <View style={styles.notifDot} />}
              </TouchableOpacity>
            </>
          )}
        </View>

        <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>

          {/* ── BILL TAB ── */}
          {activeTab === 'bill' && (
            <>
              {/* Total bar */}
              <View style={styles.totalBar}>
                <Text style={styles.totalBarLabel}>Invoice Total</Text>
                <Text style={styles.totalBarAmt}>₹{calculateTotal()}</Text>
              </View>


              <FlatList
                contentContainerStyle={styles.scroll}
                data={items}
                keyExtractor={i => i.id}
                showsVerticalScrollIndicator={false}
                removeClippedSubviews={false}
                ListHeaderComponent={
                  <View>
                    {/* Invoice meta */}
                    <View style={styles.metaRow}>
                      <View style={{ flex: 1.4, marginRight: 10 }}>
                        <Text style={styles.inputLabel}>Customer Name</Text>
                        <TextInput style={styles.inputField} placeholder="Customer Name" placeholderTextColor={COLORS.subtext} value={receiverName} onChangeText={v => saveDetail('receiver', v)} />
                      </View>
                      <View style={{ flex: 0.9 }}>
                        <Text style={styles.inputLabel}>Date</Text>
                        <TextInput style={[styles.inputField, { textAlign: 'center' }]} placeholder="DD/MM" placeholderTextColor={COLORS.subtext} value={billDate} onChangeText={v => saveDetail('date', v)} />
                      </View>
                    </View>

                    {/* Unified Add Item Panel */}
                    <View style={styles.panel}>
                      <Text style={styles.panelTitle}>Add Part or Service</Text>
                      <View style={styles.manualRow}>
                        <View style={{ flex: 2.2, marginRight: 10 }}>
                          <Text style={styles.inputLabel}>Item Name</Text>
                          <TextInput style={styles.inputField} placeholder="e.g. Engine Oil / tel badalna" placeholderTextColor={COLORS.subtext} value={itemName} onChangeText={setItemName} />
                        </View>
                        <View style={{ flex: 0.8, marginRight: 10 }}>
                          <Text style={styles.inputLabel}>Qty</Text>
                          <TextInput style={[styles.inputField, { textAlign: 'center' }]} placeholder="1" placeholderTextColor={COLORS.subtext} value={itemQty} keyboardType="numeric" onChangeText={v => setItemQty(v.replace(/[^0-9]/g, ''))} />
                        </View>
                        <View style={{ flex: 1.2 }}>
                          <Text style={styles.inputLabel}>Rate (₹)</Text>
                          <TextInput style={styles.inputField} placeholder="0" placeholderTextColor={COLORS.subtext} value={itemPrice} keyboardType="numeric" onChangeText={v => setItemPrice(v.replace(/[^0-9.]/g, ''))} />
                        </View>
                      </View>
                      {/* Recent items */}
                      {recentItems.length > 0 && (
                        <View style={{ marginBottom: 14 }}>
                          <Text style={styles.recentLabel}>Recent</Text>
                          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                            {recentItems.map((r, i) => (
                              <TouchableOpacity key={i} style={styles.recentChip} onPress={() => { setItemName(r); }}>
                                <Text style={styles.recentChipText}>{r}</Text>
                              </TouchableOpacity>
                            ))}
                          </ScrollView>
                        </View>
                      )}
                      <TouchableOpacity style={styles.primaryBtn} onPress={addItemManual} disabled={isAdding}>
                        {isAdding ? <ActivityIndicator size="small" color={COLORS.primary} /> : <Text style={styles.primaryBtnText}>+ ADD TO INVOICE</Text>}
                      </TouchableOpacity>
                    </View>

                    {/* Items list header */}
                    <View style={styles.listHdrRow}>
                      <Text style={styles.listTitle}>Items ({items.length})</Text>
                      {items.length > 0 && (
                        <TouchableOpacity onPress={clearAll}>
                          <Text style={styles.clearText}>Start New Bill</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                }
                renderItem={renderBillItem}
                ListEmptyComponent={
                  <View style={styles.emptyBox}>
                    <Text style={styles.emptyText}>No items added yet.{'\n'}Use Smart Input above to quickly add parts!</Text>
                  </View>
                }
                ListFooterComponent={<View style={{ height: 130 }} />}
              />

              {items.length > 0 && (
                <View style={styles.footerBtn}>
                  <TouchableOpacity style={styles.generateBtn} onPress={previewInvoice}>
                    <Text style={styles.generateBtnText}>SAVE & PREVIEW INVOICE</Text>
                  </TouchableOpacity>
                </View>
              )}
            </>
          )}

          {/* ── HISTORY TAB ── */}
          {activeTab === 'history' && (
            <View style={styles.historyContainer}>
              <View style={styles.listHdrRow}>
                <Text style={styles.listTitle}>Past 30 Days ({history.length})</Text>
              </View>
              <FlatList
                data={history}
                keyExtractor={i => i.id}
                renderItem={renderHistoryItem}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 40 }}
                ListEmptyComponent={
                  <View style={styles.emptyBox}>
                    <Text style={styles.emptyText}>No history yet. Bills auto-save when you preview them.</Text>
                  </View>
                }
              />
            </View>
          )}

          {/* ── PREVIEW MODAL ── */}
          <Modal visible={!!selectedRecord} animationType="slide" transparent onRequestClose={() => setSelectedRecord(null)}>
            {selectedRecord && (
              <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                  <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>Invoice Preview</Text>
                    <TouchableOpacity onPress={() => setSelectedRecord(null)} style={styles.closeBtn}>
                      <Text style={styles.closeBtnText}>✕ Close</Text>
                    </TouchableOpacity>
                  </View>

                  <ScrollView style={styles.receiptBody} showsVerticalScrollIndicator={false}>
                    <Text style={styles.receiptTitle}>{BUSINESS_DETAILS.shopName}</Text>
                    <Text style={styles.receiptSub}>{BUSINESS_DETAILS.phone}</Text>
                    <Text style={styles.receiptSub}>{BUSINESS_DETAILS.address}</Text>

                    <View style={styles.receiptDivider} />
                    <Text style={styles.receiptRow}><Text style={styles.receiptLbl}>Customer: </Text>{selectedRecord.receiver}</Text>
                    <Text style={styles.receiptRow}><Text style={styles.receiptLbl}>Date: </Text>{selectedRecord.displayDate}</Text>
                    <Text style={styles.receiptRow}><Text style={styles.receiptLbl}>Invoice: </Text>#{selectedRecord.invoiceNo}</Text>

                    <View style={styles.receiptDivider} />
                    <View style={styles.receiptTblHdr}>
                      <Text style={[styles.receiptTblLabel, { flex: 2.5 }]}>Description</Text>
                      <Text style={[styles.receiptTblLabel, { flex: 0.5, textAlign: 'center' }]}>Qty</Text>
                      <Text style={[styles.receiptTblLabel, { flex: 1, textAlign: 'right' }]}>Amt</Text>
                    </View>
                    {selectedRecord.items.map(it => (
                      <View key={it.id} style={styles.receiptItemRow}>
                        <Text style={[styles.receiptItemText, { flex: 2.5 }]} numberOfLines={1}>{it.name}</Text>
                        <Text style={[styles.receiptItemText, { flex: 0.5, textAlign: 'center' }]}>{it.qty}</Text>
                        <Text style={[styles.receiptItemText, { flex: 1, textAlign: 'right' }]}>₹{it.qty * it.price}</Text>
                      </View>
                    ))}
                    <View style={styles.receiptDivider} />

                    <View style={styles.receiptTotalRow}>
                      <Text style={styles.receiptTotalLabel}>Grand Total</Text>
                      <Text style={styles.receiptTotalAmt}>₹{selectedRecord.total}</Text>
                    </View>
                    <View style={{ height: 50 }} />
                  </ScrollView>

                  <View style={styles.modalFooter}>
                    <TouchableOpacity style={styles.shareBtn} onPress={() => sharePDF(selectedRecord)}>
                      <Text style={styles.shareBtnText}>EXPORT & SHARE PDF</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            )}
          </Modal>

        </KeyboardAvoidingView>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

// ─── STYLES ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.primary },
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 20, backgroundColor: COLORS.primary, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  shopName: { color: COLORS.text, fontSize: 21, fontWeight: '900', letterSpacing: 0.3 },
  shopSub: { color: COLORS.subtext, fontSize: 13, fontWeight: '500', marginTop: 3 },
  historyIconBtn: { backgroundColor: 'rgba(255,255,255,0.1)', width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  historyIconText: { fontSize: 22 },
  notifDot: { width: 10, height: 10, backgroundColor: COLORS.error, borderRadius: 5, position: 'absolute', top: 8, right: 8, borderWidth: 2, borderColor: COLORS.primary },
  backBtn: { backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 14, paddingVertical: 9, borderRadius: 8 },
  backBtnText: { color: COLORS.text, fontWeight: '700', fontSize: 14 },
  totalBar: { paddingHorizontal: 20, paddingVertical: 14, backgroundColor: COLORS.card, borderBottomWidth: 1, borderColor: COLORS.border, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalBarLabel: { color: COLORS.subtext, fontSize: 14, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  totalBarAmt: { color: COLORS.accent, fontSize: 26, fontWeight: '900' },
  scroll: { paddingHorizontal: 20, paddingTop: 16 },
  metaRow: { flexDirection: 'row', marginBottom: 16, alignItems: 'flex-end' },
  modeToggle: { flexDirection: 'row', backgroundColor: COLORS.card, borderRadius: 14, padding: 5, borderWidth: 1, borderColor: COLORS.border, marginBottom: 16 },
  modeBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
  modeBtnActive: { backgroundColor: COLORS.primary },
  modeBtnText: { color: COLORS.subtext, fontWeight: '700', fontSize: 14 },
  modeBtnActiveText: { color: COLORS.accent },
  panel: { backgroundColor: COLORS.card, padding: 18, borderRadius: 18, borderWidth: 1, borderColor: COLORS.border, marginBottom: 20 },
  panelTitle: { color: COLORS.text, fontSize: 17, fontWeight: '800', marginBottom: 6 },
  panelHint: { color: COLORS.subtext, fontSize: 13, fontWeight: '500', marginBottom: 14, lineHeight: 18 },
  smartRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  parseBtn: { backgroundColor: COLORS.accent, paddingHorizontal: 18, paddingVertical: 14, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  parseBtnText: { color: COLORS.primary, fontWeight: '900', fontSize: 15 },
  recentLabel: { color: COLORS.subtext, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
  recentChip: { backgroundColor: 'rgba(249,115,22,0.12)', borderWidth: 1, borderColor: 'rgba(249,115,22,0.3)', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7, marginRight: 8 },
  recentChipText: { color: COLORS.accent, fontWeight: '700', fontSize: 13 },
  manualRow: { flexDirection: 'row', marginBottom: 14, alignItems: 'flex-end' },
  inputLabel: { fontSize: 12, fontWeight: '700', color: COLORS.subtext, marginBottom: 7, textTransform: 'uppercase', letterSpacing: 0.5 },
  inputLabelSm: { fontSize: 10, fontWeight: '700', color: COLORS.subtext, marginBottom: 5, textTransform: 'uppercase' },
  inputField: { backgroundColor: COLORS.background, borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13, fontSize: 15, fontWeight: '600', color: COLORS.text },
  primaryBtn: { backgroundColor: COLORS.accent, borderRadius: 13, paddingVertical: 15, alignItems: 'center', justifyContent: 'center', minHeight: 50 },
  primaryBtnText: { color: COLORS.primary, fontSize: 15, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.5 },
  listHdrRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, paddingHorizontal: 2 },
  listTitle: { color: COLORS.text, fontSize: 18, fontWeight: '800' },
  clearText: { color: COLORS.error, fontSize: 14, fontWeight: '700' },
  itemCard: { flexDirection: 'row', backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border, padding: 14, borderRadius: 15, marginBottom: 10, alignItems: 'flex-end' },
  cardInput: { fontSize: 14, fontWeight: '600', color: COLORS.text, backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 8, paddingHorizontal: 9, paddingVertical: 7, borderWidth: 1, borderColor: COLORS.border },
  deleteBtn: { backgroundColor: 'rgba(239,68,68,0.15)', width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)' },
  deleteBtnText: { color: COLORS.error, fontSize: 15, fontWeight: '900' },
  emptyBox: { backgroundColor: 'rgba(30,41,59,0.5)', padding: 28, borderRadius: 16, borderWidth: 1, borderColor: COLORS.border, borderStyle: 'dashed', marginTop: 8 },
  emptyText: { textAlign: 'center', color: COLORS.subtext, fontSize: 14, fontWeight: '500', lineHeight: 21 },
  footerBtn: { position: 'absolute', bottom: 20, left: 20, right: 20 },
  generateBtn: { backgroundColor: COLORS.success, padding: 17, borderRadius: 16, alignItems: 'center', shadowColor: COLORS.success, shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.4, shadowRadius: 8, elevation: 6 },
  generateBtnText: { color: COLORS.primary, fontSize: 17, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.8 },
  historyContainer: { flex: 1, paddingHorizontal: 20, paddingTop: 16 },
  historyCard: { backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border, padding: 18, borderRadius: 16, marginBottom: 14, flexDirection: 'row' },
  historyTitle: { color: COLORS.text, fontSize: 17, fontWeight: '800', marginBottom: 5 },
  historySub: { color: COLORS.subtext, fontSize: 13, fontWeight: '500', marginBottom: 2 },
  historyAmt: { color: COLORS.success, fontSize: 20, fontWeight: '900' },
  historyViewText: { color: COLORS.subtext, fontSize: 12, marginTop: 4 },

  // Confirmation banner
  confirmBanner: { marginHorizontal: 20, marginBottom: 8, backgroundColor: '#1A3A2C', borderWidth: 1, borderColor: COLORS.success, borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center' },
  confirmLabel: { color: COLORS.success, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 },
  confirmName: { color: COLORS.text, fontSize: 17, fontWeight: '800' },
  confirmPrice: { color: COLORS.accent, fontSize: 15, fontWeight: '700', marginTop: 2 },
  confirmBadge: { color: COLORS.success, fontSize: 12, fontWeight: '600' },
  confirmBtnNo: { backgroundColor: 'rgba(239,68,68,0.15)', width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)', marginRight: 8 },
  confirmBtnNoText: { color: COLORS.error, fontWeight: '900', fontSize: 15 },
  confirmBtnYes: { backgroundColor: COLORS.success, paddingHorizontal: 16, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  confirmBtnYesText: { color: COLORS.primary, fontWeight: '900', fontSize: 14 },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(2,6,23,0.95)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: COLORS.card, height: '92%', borderTopLeftRadius: 30, borderTopRightRadius: 30, overflow: 'hidden' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', padding: 22, borderBottomWidth: 1, borderColor: COLORS.border, alignItems: 'center' },
  modalTitle: { color: COLORS.text, fontSize: 21, fontWeight: '800' },
  closeBtn: { backgroundColor: 'rgba(255,255,255,0.08)', paddingHorizontal: 14, paddingVertical: 9, borderRadius: 10 },
  closeBtnText: { color: COLORS.subtext, fontWeight: '700' },
  receiptBody: { padding: 22 },
  receiptTitle: { fontSize: 22, fontWeight: '900', color: COLORS.text, textAlign: 'center' },
  receiptSub: { fontSize: 12, color: COLORS.subtext, textAlign: 'center', lineHeight: 18 },
  receiptDivider: { height: 1, backgroundColor: COLORS.border, marginVertical: 14 },
  receiptRow: { color: COLORS.text, fontSize: 14, marginBottom: 4 },
  receiptLbl: { fontWeight: '800', color: COLORS.subtext },
  receiptTblHdr: { flexDirection: 'row', marginBottom: 10 },
  receiptTblLabel: { color: COLORS.subtext, fontWeight: '800', fontSize: 12, textTransform: 'uppercase' },
  receiptItemRow: { flexDirection: 'row', marginBottom: 9 },
  receiptItemText: { color: COLORS.text, fontSize: 15, fontWeight: '600' },
  receiptTotalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 },
  receiptTotalLabel: { color: COLORS.text, fontSize: 19, fontWeight: '700' },
  receiptTotalAmt: { color: COLORS.success, fontSize: 27, fontWeight: '900' },
  modalFooter: { padding: 18, borderTopWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.background },
  shareBtn: { backgroundColor: COLORS.success, padding: 19, borderRadius: 16, alignItems: 'center' },
  shareBtnText: { color: COLORS.primary, fontSize: 17, fontWeight: '900', letterSpacing: 1 },
});
