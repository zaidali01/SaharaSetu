// Matches a Twilio SpeechResult transcript against the routing rules
// from person1/call_state_machine.json. Kept as plain JS so it's easy
// to unit-test and doesn't depend on file paths across folders.

const DISTRESS_KEYWORDS = [
  'theek nahi', 'tabiyat kharab', 'dard', 'bukhar', 'gir gaya', 'gir gayi', 'madad',
];

const YES_WORDS = ['haan', 'bhej do', 'theek hai', 'ha', 'kar do'];
const NO_WORDS = ['nahi', 'abhi mat', 'na'];
const GAS_LOW_WORDS = ['khatam ho raha hai', 'kam hai', 'khatam'];
const GAS_FINE_WORDS = ['theek hai', 'abhi theek hai'];

// DTMF fallback maps (task 1.5) — digit pressed -> same result labels
// used by the speech matchers, so server.js branches identically either way.
const MEDICINE_DTMF_MAP = { '1': 'yes', '2': 'no' };
const GAS_DTMF_MAP = { '1': 'low', '2': 'fine' };

function normalize(text) {
  return (text || '').toLowerCase().trim();
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
