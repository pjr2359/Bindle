/**
 * IATA airline code to full name for display. Unknown codes shown as-is.
 */
const AIRLINE_NAMES: Record<string, string> = {
  AA: 'American Airlines',
  AC: 'Air Canada',
  BA: 'British Airways',
  B6: 'JetBlue',
  DL: 'Delta Air Lines',
  FI: 'Icelandair',
  FR: 'Ryanair',
  LH: 'Lufthansa',
  NK: 'Spirit Airlines',
  UA: 'United Airlines',
  VS: 'Virgin Atlantic',
  TP: 'TAP Air Portugal',
  EI: 'Aer Lingus',
  AF: 'Air France',
  KL: 'KLM',
  EK: 'Emirates',
  QR: 'Qatar Airways',
  SQ: 'Singapore Airlines',
  CX: 'Cathay Pacific',
  JL: 'Japan Airlines',
  NH: 'ANA',
  QF: 'Qantas',
  IB: 'Iberia',
  AZ: 'ITA Airways',
  SN: 'Brussels Airlines',
  OS: 'Austrian Airlines',
  LX: 'Swiss International Air Lines',
  DY: 'Norwegian',
  W6: 'Wizz Air',
  U2: 'easyJet',
  F9: 'Frontier Airlines',
  AS: 'Alaska Airlines',
  G4: 'Allegiant Air',
  SY: 'Sun Country Airlines',
  WN: 'Southwest Airlines',
};

export function getAirlineName(code: string): string {
  if (!code || typeof code !== 'string') return code ?? '-';
  const upper = code.trim().toUpperCase();
  return AIRLINE_NAMES[upper] ?? upper;
}
