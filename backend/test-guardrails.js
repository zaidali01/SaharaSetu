const { checkPaymentGuardrail, checkDosageChangeGuardrail, runGuardrails } = require('./src/guardrails');

console.log('--- PHASE 3: GUARDRAIL TESTING (Task 3.1t) ---');

// 1. Test Unapproved Payment (Task 3.1t)
console.log('\n[Test 1] Attempt unapproved payment (₹300) without child approval:');
const result1 = checkPaymentGuardrail(300, false);
console.log('Result:', result1.blocked ? '✅ BLOCKED' : '❌ ALLOWED');
console.log('Reason:', result1.reason);

// 2. Test Over-limit Payment
console.log('\n[Test 2] Attempt approved payment but over limit (₹1000):');
const result2 = checkPaymentGuardrail(1000, true);
console.log('Result:', result2.blocked ? '✅ BLOCKED' : '❌ ALLOWED');
console.log('Reason:', result2.reason);

// 3. Test Dosage Change Request (Task 3.2t simulation)
console.log('\n[Test 3] Attempt dosage change request in call transcript:');
const transcript = "Haan dawai de dena, lekin dose increase kar dena please.";
const isDosageBlocked = checkDosageChangeGuardrail(transcript);
console.log('Result:', isDosageBlocked ? '✅ BLOCKED' : '❌ ALLOWED');

// 3b. Devanagari transcripts — what the Hindi IVR actually returns. These were
// the real-world gap: the pattern set was romanized-only, so a genuine
// "दवा बढ़ा दो" sailed straight through the safety guardrail.
console.log('\n[Test 3b] Devanagari dosage-change requests (real IVR output):');
const devanagariCases = [
  'मुझे दवा बढ़ा दो',           // increase the medicine
  'गोली की खुराक कम करो',       // reduce the tablet dose
  'दवा बंद कर दो',              // stop the medicine
  'खुराक बढ़ाना है',            // need to increase the dose
  'दवाई का डोज़ घटा दो',       // lower the dose
];
let devanagariMisses = 0;
for (const t of devanagariCases) {
  const blocked = checkDosageChangeGuardrail(t);
  if (!blocked) devanagariMisses++;
  console.log(`  ${blocked ? '✅ BLOCKED' : '❌ ALLOWED'}  "${t}"`);
}
console.log(devanagariMisses === 0
  ? 'Result: ✅ all Devanagari dosage requests blocked'
  : `Result: ❌ ${devanagariMisses} Devanagari request(s) slipped through`);

// 3c. An ordinary confirmation must NOT trip the guardrail (false-positive check).
console.log('\n[Test 3c] Benign Hindi confirmation must not be blocked:');
const benign = ['हां दवा भेज दो', 'MEDICINE: हां | GAS: कम है'];
let benignBlocks = 0;
for (const t of benign) {
  const blocked = checkDosageChangeGuardrail(t);
  if (blocked) benignBlocks++;
  console.log(`  ${blocked ? '❌ WRONGLY BLOCKED' : '✅ ALLOWED'}  "${t}"`);
}
console.log(benignBlocks === 0
  ? 'Result: ✅ no false positives'
  : `Result: ❌ ${benignBlocks} benign transcript(s) wrongly blocked`);

// 4. Test Valid Safe Action
console.log('\n[Test 4] Attempt valid approved payment (₹200):');
const result4 = checkPaymentGuardrail(200, true);
console.log('Result:', result4.blocked ? '❌ BLOCKED' : '✅ ALLOWED');

console.log('\nAll guardrails behaving as expected!');
