import Fuse from 'fuse.js';
import { GARAGE_DATASET, DatasetItem } from './serviceDataset';

// ─── Build a flat alias list for Fuse ────────────────────────────────────────
interface FuseEntry {
  alias: string;
  item: DatasetItem;
}

const fuseList: FuseEntry[] = [];
for (const item of GARAGE_DATASET) {
  for (const alias of item.aliases) {
    fuseList.push({ alias: alias.toLowerCase(), item });
  }
}

const fuse = new Fuse(fuseList, {
  keys: ['alias'],
  threshold: 0.45,       // 0 = perfect match, 1 = very loose
  includeScore: true,
  shouldSort: true,
  minMatchCharLength: 2,
});

// ─── Normalize input ──────────────────────────────────────────────────────────
export function normalizeText(raw: string): string {
  return raw.trim().toLowerCase().replace(/\s+/g, ' ');
}

// ─── Extract price (first integer found) ─────────────────────────────────────
export function extractPrice(text: string): number {
  const match = text.match(/\d+(\.\d+)?/);
  return match ? parseFloat(match[0]) : 0;
}

// ─── Extract name (strip all numbers) ────────────────────────────────────────
export function extractNameText(text: string): string {
  return text.replace(/\d+(\.\d+)?/g, '').replace(/\s+/g, ' ').trim();
}

// ─── Fuzzy match name → dataset entry ────────────────────────────────────────
export function matchToDataset(nameText: string): DatasetItem | null {
  if (!nameText) return null;

  const results = fuse.search(nameText);
  if (results.length > 0 && results[0].score !== undefined && results[0].score < 0.45) {
    return results[0].item.item;
  }
  return null;
}

// ─── MAIN PARSER ─────────────────────────────────────────────────────────────
export interface ParsedItem {
  name: string;
  price: number;
  matchedStandardName: string | null;
  category: 'service' | 'part' | 'charge' | null;
  wasMatched: boolean;
}

export function parseInput(rawInput: string): ParsedItem | null {
  const normalized = normalizeText(rawInput);
  if (!normalized) return null;

  const price = extractPrice(normalized);
  const nameText = extractNameText(normalized);

  if (!nameText) return null;

  const matched = matchToDataset(nameText);

  return {
    name: matched ? matched.name : capitalize(nameText),
    price,
    matchedStandardName: matched ? matched.name : null,
    category: matched ? matched.category : null,
    wasMatched: !!matched,
  };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
