const { checkDosageChange } = require('./guardrails');

const cases = [
    ['दवाई का डोज़ बढ़ा दो, 2 गोली कर दो', true],   // demo script phrase
    ['दवाई बढ़ा दो', true],
    ['गोली बंद कर दो', true],
    ['खुराक कम कर दो', true],
    ['हां भेज दो', false],
    ['दवाई कम है', false],                          // "medicine is low" — must NOT trigger
    ['ठीक है', false],
    ['दवाई की का दूज बढ़ा, दो दो गोली कर दो।', true], // real Twilio transcript, 26-Sep
    ['दूज कम कर दो', true],                          // dose-word path alone
    ['दवाई बढ़िया है', false],                         // "medicine is fine" — must NOT trigger
];

let fails = 0;
cases.forEach(([text, expected], i) => {
    const got = checkDosageChange(text);
    if (got !== expected) fails++;
    console.log(`case ${i + 1}: ${got === expected ? 'PASS' : 'FAIL'} (expected ${expected}, got ${got})`);
});
console.log(fails ? `${fails} FAILED` : 'ALL PASS');