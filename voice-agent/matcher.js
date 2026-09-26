// Matches a Twilio SpeechResult transcript against routing rules.
//
// IMPORTANT: Twilio's hi-IN speech recognition returns Devanagari script
// (e.g. "हां", "ठीक है"), NOT romanized Hindi ("haan", "theek hai").
// These lists must stay in Devanagari or matching silently fails —
// this was the actual bug behind "not listening properly."

const DISTRESS_KEYWORDS = [
  'ठीक नहीं', 'तबियत खराब', 'तबीयत खराब', 'दर्द', 'बुखार', 'गिर गया', 'गिर गई', 'मदद',
];

const YES_WORDS = ['हां', 'हाँ', 'भेज दो', 'ठीक है', 'भेजो', 'कर दो', 'हाँ जी', 'हां जी'];
const NO_WORDS = ['नहीं', 'अभी मत', 'ना', 'रहने दो'];
const GAS_LOW_WORDS = ['खत्म हो रहा है', 'कम है', 'खत्म'];
const GAS_FINE_WORDS = ['ठीक है', 'अभी ठीक है'];

// DTMF fallback maps (task 1.5) — digit pressed -> same result labels
// used by the speech matchers, so server.js branches identically either way.
const MEDICINE_DTMF_MAP = { '1': 'yes', '2': 'no' };
const GAS_DTMF_MAP = { '1': 'low', '2': 'fine' };

function normalize(text) {
  return (text || '').trim();
}

function containsAny(text, wordList) {
  const norm = normalize(text);
  return wordList.some((w) => norm.includes(w));
}

function checkDistress(speechText) {
  return containsAny(speechText, DISTRESS_KEYWORDS);
}

// digit param is optional — pass it whenever the Gather also accepted DTMF.
// Digit takes priority: if the parent pressed a key, trust that over any
// (likely empty) SpeechResult in the same request.
function matchMedicineResponse(speechText, digit) {
  if (digit && MEDICINE_DTMF_MAP[digit]) return MEDICINE_DTMF_MAP[digit];
  if (checkDistress(speechText)) return 'distress';
  if (containsAny(speechText, YES_WORDS)) return 'yes';
  if (containsAny(speechText, NO_WORDS)) return 'no';
  return 'unclear';
}

function matchGasResponse(speechText, digit) {
  if (digit && GAS_DTMF_MAP[digit]) return GAS_DTMF_MAP[digit];
  if (checkDistress(speechText)) return 'distress';
  if (containsAny(speechText, GAS_LOW_WORDS)) return 'low';
  if (containsAny(speechText, GAS_FINE_WORDS)) return 'fine';
  return 'unclear';
}

module.exports = { matchMedicineResponse, matchGasResponse, checkDistress };