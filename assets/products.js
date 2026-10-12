/*
 * Nano Motion product catalog.
 * Prices are stored per market in the currency's ISO 4217 minor unit,
 * exactly as the OpenAI Pixel expects them (USD 98.00 -> 9800, JPY 14,800 -> 14800).
 * No conversion happens at runtime, so there is no rounding to get wrong.
 */
window.NM_MARKETS = {
  US: { country: 'US', label: 'United States', currency: 'USD', symbol: '$',  decimals: 2, locale: 'en-US', optIn: false, freeShip: 7500 },
  GB: { country: 'GB', label: 'United Kingdom', currency: 'GBP', symbol: '£', decimals: 2, locale: 'en-GB', optIn: true,  freeShip: 6000 },
  DE: { country: 'DE', label: 'Germany',        currency: 'EUR', symbol: '€', decimals: 2, locale: 'de-DE', optIn: true,  freeShip: 7000 },
  JP: { country: 'JP', label: 'Japan',          currency: 'JPY', symbol: '¥', decimals: 0, locale: 'ja-JP', optIn: false, freeShip: 12000 }
};

window.NM_PRODUCTS = [
  {
    id: 'NM-RJ-01', name: 'Stride Running Jacket', category: 'Running', color: 'Black', colorCode: 'BLK',
    price: { USD: 9800, GBP: 7800, EUR: 8900, JPY: 14800 },
    sizes: ['XS', 'S', 'M', 'L', 'XL'], soldOut: ['L'],
    rating: 4.8, reviews: 2143, fit: 'True to size', fitMeter: 50,
    model: 'Model is 5\'11" and wears M',
    tone: '#1f2421', badge: 'Best Seller',
    blurb: 'Featherweight wind shell with a packable hood and reflective hits for early miles.',
    highlights: ['Reviewers love how light it packs', 'Runs true to size with room for a layer', 'Some wish it had a chest pocket'],
    kit: ['NM-SK-02', 'NM-TS-04']
  },
  {
    id: 'NM-SK-02', name: 'Tempo Run Socks', category: 'Accessories', color: 'White', colorCode: 'WHT',
    price: { USD: 1800, GBP: 1500, EUR: 1700, JPY: 2800 },
    sizes: ['S', 'M', 'L'], soldOut: [],
    rating: 4.7, reviews: 3870, fit: 'True to size', fitMeter: 50,
    model: 'One pair per pack',
    tone: '#e9e6df', badge: null,
    blurb: 'Cushioned heel, seamless toe, and an arch band that stays put past mile ten.',
    highlights: ['No blisters on long runs', 'Holds shape after many washes', 'Thicker than some expect'],
    kit: ['NM-RJ-01', 'NM-RS-05']
  },
  {
    id: 'NM-LG-03', name: 'Flow Legging', category: 'Yoga', color: 'Sage', colorCode: 'SGE',
    price: { USD: 11000, GBP: 8800, EUR: 9900, JPY: 16500 },
    sizes: ['XS', 'S', 'M', 'L', 'XL'], soldOut: ['L'],
    rating: 4.9, reviews: 5212, fit: 'Snug, compressive', fitMeter: 30,
    model: 'Model is 5\'9" and wears S',
    tone: '#9aa98f', badge: 'Back in Stock',
    blurb: 'Buttery four-way stretch with a high waistband that never rolls in a forward fold.',
    highlights: ['Squat-proof and opaque', 'Soft enough to wear all day', 'Size up if between sizes'],
    kit: ['NM-BR-06', 'NM-MT-08']
  },
  {
    id: 'NM-TS-04', name: 'Base Training Tee', category: 'Training', color: 'Stone', colorCode: 'STN',
    price: { USD: 5800, GBP: 4600, EUR: 5200, JPY: 8800 },
    sizes: ['XS', 'S', 'M', 'L', 'XL'], soldOut: [],
    rating: 4.6, reviews: 1980, fit: 'Relaxed', fitMeter: 70,
    model: 'Model is 6\'1" and wears L',
    tone: '#cfc6b8', badge: null,
    blurb: 'Quick-dry jersey with flatlock seams. Lifts, intervals, then lunch.',
    highlights: ['Dries fast between sets', 'Relaxed through the body', 'Light colors show sweat'],
    kit: ['NM-RS-05', 'NM-SK-02']
  },
  {
    id: 'NM-RS-05', name: 'Interval Short 7"', category: 'Training', color: 'Navy', colorCode: 'NVY',
    price: { USD: 7800, GBP: 6200, EUR: 7000, JPY: 11800 },
    sizes: ['S', 'M', 'L', 'XL'], soldOut: [],
    rating: 4.8, reviews: 2764, fit: 'True to size', fitMeter: 50,
    model: 'Model is 6\'0" and wears M',
    tone: '#28344a', badge: 'New',
    blurb: 'Lined short with a phone pocket that does not bounce. Built for hybrid days.',
    highlights: ['Phone stays put on runs', 'Liner is soft, not scratchy', 'Shorter inseam than some like'],
    kit: ['NM-TS-04', 'NM-SK-02']
  },
  {
    id: 'NM-BR-06', name: 'Studio Bra', category: 'Yoga', color: 'Sage', colorCode: 'SGE',
    price: { USD: 6800, GBP: 5400, EUR: 6100, JPY: 10200 },
    sizes: ['XS', 'S', 'M', 'L'], soldOut: [],
    rating: 4.7, reviews: 1655, fit: 'Snug, medium support', fitMeter: 35,
    model: 'Model is 5\'9" and wears S',
    tone: '#b6c2ab', badge: null,
    blurb: 'Medium support with removable cups. Matches the Flow Legging.',
    highlights: ['Comfortable for long classes', 'Straps do not dig', 'Cups can shift in the wash'],
    kit: ['NM-LG-03', 'NM-MT-08']
  },
  {
    id: 'NM-SH-07', name: 'Summit Insulated Shell', category: 'Outerwear', color: 'Clay', colorCode: 'CLY',
    price: { USD: 16800, GBP: 13400, EUR: 15200, JPY: 25200 },
    sizes: ['XS', 'S', 'M', 'L', 'XL'], soldOut: [],
    rating: 4.8, reviews: 942, fit: 'Relaxed', fitMeter: 65,
    model: 'Model is 5\'10" and wears M',
    tone: '#b0714f', badge: 'Limited',
    blurb: 'Recycled synthetic fill, water-resistant face, warm enough for winter long runs.',
    highlights: ['Warm without bulk', 'Sheds light rain', 'Hood is not adjustable'],
    kit: ['NM-SK-02', 'NM-RJ-01']
  },
  {
    id: 'NM-MT-08', name: 'Grip Yoga Mat', category: 'Accessories', color: 'Charcoal', colorCode: 'CHR',
    price: { USD: 8800, GBP: 7000, EUR: 7900, JPY: 13200 },
    sizes: ['OS'], soldOut: [],
    rating: 4.9, reviews: 3310, fit: 'One size', fitMeter: 50,
    model: '183 x 66 cm, 5 mm',
    tone: '#3b3d40', badge: null,
    blurb: 'Natural rubber base with a polyurethane top that grips harder as you sweat.',
    highlights: ['No slipping in hot classes', 'Heavy but stable', 'Smell fades after a week'],
    kit: ['NM-LG-03', 'NM-BR-06']
  }
];

window.NM_PLANS = {
  club_trial_30d: { id: 'club_trial_30d', name: 'Nano Motion Club, 30-day free trial', price: null },
  club_monthly:   { id: 'club_monthly',   name: 'Nano Motion Club, monthly', price: { USD: 1500, GBP: 1200, EUR: 1400, JPY: 2200 } }
};
