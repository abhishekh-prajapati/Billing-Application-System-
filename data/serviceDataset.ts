export interface DatasetItem {
  id: string;
  name: string;       // Standard billing name
  category: 'service' | 'part' | 'charge';
  aliases: string[];  // Hindi, Hinglish, common misspellings, short forms
}

export const GARAGE_DATASET: DatasetItem[] = [
  // ─── SERVICES ───────────────────────────────────────────────────────────────
  {
    id: 'oil_change',
    name: 'Oil Change',
    category: 'service',
    aliases: [
      'oil change', 'oil badalna', 'tel badalna', 'tel change', 'oil dal',
      'engine oil change', 'engine tel', 'mobil badalna', 'mobil change',
      'oil chng', 'oil chnge', 'oilchange', 'tel bdlna',
    ],
  },
  {
    id: 'brake_service',
    name: 'Brake Service',
    category: 'service',
    aliases: [
      'brake service', 'brek servis', 'brake servis', 'brake repair', 'brake thik',
      'brek thik', 'brakes', 'brek', 'brk service', 'brakes change', 'brak service',
      'brake fix', 'brek fix', 'disk brake', 'drum brake service',
    ],
  },
  {
    id: 'puncture_repair',
    name: 'Puncture Repair',
    category: 'service',
    aliases: [
      'puncture', 'pankchar', 'panchar', 'tyre puncture', 'punchar',
      'punchr', 'pnkchar', 'tyre repair', 'tube repair', 'puncture repair',
      'pankcher', 'puncher', 'type repair',
    ],
  },
  {
    id: 'wheel_alignment',
    name: 'Wheel Alignment',
    category: 'service',
    aliases: [
      'wheel alignment', 'alignment', 'align', 'whel alignment', 'wheel align',
      'pehiya seedha', 'pahiya seedha', 'steering alignment', 'tyre alignment',
      'alignmnt', 'alainment',
    ],
  },
  {
    id: 'wheel_balancing',
    name: 'Wheel Balancing',
    category: 'service',
    aliases: [
      'wheel balancing', 'balancing', 'balance', 'tyre balancing', 'whel balancing',
      'balancng', 'wheel balance', 'tyre balance', 'balancing service',
    ],
  },
  {
    id: 'car_wash',
    name: 'Car Wash',
    category: 'service',
    aliases: [
      'car wash', 'washing', 'dhona', 'car dhona', 'gaadi dhona', 'wash',
      'car clean', 'cleaning', 'full wash', 'regular wash',
    ],
  },
  {
    id: 'ac_service',
    name: 'AC Service',
    category: 'service',
    aliases: [
      'ac service', 'ac repair', 'ac thik', 'ac servicing', 'air conditioner service',
      'ac gas', 'cooling repair', 'ac fix', 'a/c service', 'a.c service',
      'ac check', 'ac recharge',
    ],
  },
  {
    id: 'engine_service',
    name: 'Engine Service',
    category: 'service',
    aliases: [
      'engine service', 'engine repair', 'engine thik', 'engine overhauling',
      'engine fix', 'engine work', 'engine servicing', 'engine check', 'engn service',
    ],
  },
  {
    id: 'suspension_repair',
    name: 'Suspension Repair',
    category: 'service',
    aliases: [
      'suspension', 'suspension repair', 'shock absorber', 'shockup', 'shock up',
      'shocks', 'suspension thik', 'shokr absorber', 'absorber repair',
      'suspension service', 'spring repair',
    ],
  },
  {
    id: 'battery_service',
    name: 'Battery Service',
    category: 'service',
    aliases: [
      'battery', 'battery service', 'battery repair', 'battery check',
      'battery thik', 'battry', 'batery', 'battery jump', 'battery start',
      'batrry service',
    ],
  },
  {
    id: 'tyre_change',
    name: 'Tyre Change',
    category: 'service',
    aliases: [
      'tyre change', 'tyre badalna', 'type change', 'tyre replace', 'tyre fitting',
      'new tyre', 'tyre fit', 'tire change', 'tire badalna', 'tyer change',
    ],
  },
  {
    id: 'gear_service',
    name: 'Gear Box Service',
    category: 'service',
    aliases: [
      'gear service', 'gearbox', 'gear box service', 'gear repair', 'gear thik',
      'transmission service', 'transmission repair', 'gear oil change',
    ],
  },
  {
    id: 'clutch_service',
    name: 'Clutch Service',
    category: 'service',
    aliases: [
      'clutch', 'clutch service', 'clutch repair', 'clutch plate', 'clutch thik',
      'clutch change', 'cluch service', 'clatch', 'clutch fix',
    ],
  },
  {
    id: 'denting_painting',
    name: 'Denting & Painting',
    category: 'service',
    aliases: [
      'denting', 'painting', 'denting painting', 'body repair', 'paint', 'rang',
      'bodywork', 'body work', 'scratch repair', 'scratch fix', 'dingi repair',
      'knock repair', 'dent repair', 'paint job',
    ],
  },
  {
    id: 'radiator_service',
    name: 'Radiator Service',
    category: 'service',
    aliases: [
      'radiator', 'radiator repair', 'radiator service', 'cooling system',
      'overheat repair', 'cooling repair', 'water pump service', 'radiater',
    ],
  },
  {
    id: 'electrical_work',
    name: 'Electrical Work',
    category: 'service',
    aliases: [
      'electrical', 'wiring', 'electrical work', 'electrical repair', 'light repair',
      'lighting', 'bijli kaam', 'bijli repair', 'electrical service', 'wiring repair',
    ],
  },

  // ─── PARTS ──────────────────────────────────────────────────────────────────
  {
    id: 'engine_oil',
    name: 'Engine Oil',
    category: 'part',
    aliases: [
      'engine oil', 'tel', 'oil', 'mobil', 'engine tel', 'motor oil',
      'lubricant', 'lubrication oil', 'castrol', 'mobil oil', 'servo oil',
    ],
  },
  {
    id: 'oil_filter',
    name: 'Oil Filter',
    category: 'part',
    aliases: [
      'oil filter', 'filter', 'oil filtr', 'tel filter', 'engine filter',
      'filter change', 'filter badalna',
    ],
  },
  {
    id: 'air_filter',
    name: 'Air Filter',
    category: 'part',
    aliases: [
      'air filter', 'air filtr', 'hawa filter', 'air cleaner', 'airfilter',
    ],
  },
  {
    id: 'brake_pads',
    name: 'Brake Pads',
    category: 'part',
    aliases: [
      'brake pads', 'pad', 'brake pad', 'brek pad', 'brk pads', 'disk pads',
      'disc pads', 'brake shoes', 'brek shoes',
    ],
  },
  {
    id: 'spark_plug',
    name: 'Spark Plug',
    category: 'part',
    aliases: [
      'spark plug', 'plug', 'spark', 'buji', 'bouji', 'bujji', 'sparks',
      'plug change', 'spark plug change',
    ],
  },
  {
    id: 'coolant',
    name: 'Coolant',
    category: 'part',
    aliases: [
      'coolant', 'radiator water', 'antifreeze', 'cooling liquid', 'pani',
      'radiator fluid', 'coolent',
    ],
  },
  {
    id: 'wiper_blade',
    name: 'Wiper Blade',
    category: 'part',
    aliases: [
      'wiper', 'wipers', 'wiper blade', 'wiper replace', 'wiper change',
      'windshield wiper', 'wiperblade',
    ],
  },
  {
    id: 'headlight_bulb',
    name: 'Headlight Bulb',
    category: 'part',
    aliases: [
      'headlight', 'bulb', 'light bulb', 'headlamp', 'head light',
      'headlight bulb', 'led bulb', 'halogen bulb',
    ],
  },
  {
    id: 'battery',
    name: 'Battery',
    category: 'part',
    aliases: [
      'battery', 'battry', 'new battery', 'battery replace', 'battery badalna',
      'batery', 'car battery', 'amaron', 'exide',
    ],
  },
  {
    id: 'timing_belt',
    name: 'Timing Belt',
    category: 'part',
    aliases: [
      'timing belt', 'belt', 'timing chain', 'timing', 'cam belt',
      'timing belt change',
    ],
  },

  // ─── CHARGES ─────────────────────────────────────────────────────────────────
  {
    id: 'labour',
    name: 'Labour Charge',
    category: 'charge',
    aliases: [
      'labour', 'labor', 'labour charge', 'labor charge', 'mehnat', 'majduri',
      'karigari', 'labour cost', 'service charge', 'service fee', 'servis charge',
    ],
  },
  {
    id: 'inspection',
    name: 'Inspection Charge',
    category: 'charge',
    aliases: [
      'inspection', 'inspection charge', 'checking charge', 'check charge',
      'diagnosis', 'check up', 'checkup', 'jaanch', 'jaanch faees',
    ],
  },
  {
    id: 'miscellaneous',
    name: 'Miscellaneous',
    category: 'charge',
    aliases: [
      'misc', 'miscellaneous', 'other', 'extra', 'fani', 'aur', 'chota kaam',
      'sundry', 'small job',
    ],
  },
];
