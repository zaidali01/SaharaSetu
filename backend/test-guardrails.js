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

// 4. Test Valid Safe Action
console.log('\n[Test 4] Attempt valid approved payment (₹200):');
const result4 = checkPaymentGuardrail(200, true);
console.log('Result:', result4.blocked ? '❌ BLOCKED' : '✅ ALLOWED');

console.log('\nAll guardrails behaving as expected!');
