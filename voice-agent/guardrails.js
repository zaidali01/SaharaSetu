// Guardrail (Phase 3, task 3.2t): detect dosage-change requests in the
// parent's speech so the agent refuses them instead of treating them as "yes".
// Self-contained normalization: NFD splits precomposed nuqta letters (ढ़ ज़)
// into base + nuqta, then the nuqta (U+093C) is stripped. Keywords go through
// the same function, so both sides are always compared in the same form.

function norm(text) {
    return (text || '').normalize('NFD').replace(/\u093C/g, '');
}

// 'दूज' = observed Twilio mis-transcription of 'डोज़'.
const DOSE_WORDS = ['डोज', 'दूज', 'खुराक', 'खूराक'].map(norm);
const MED_WORDS = ['दवा', 'गोली', 'टैबलेट', 'टेबलेट'].map(norm); // 'दवा' also covers 'दवाई'
// 'बढ़ा' (not 'बढ') so 'बढ़िया' (great) doesn't count as a change request.
const CHANGE_WORDS = ['बढ़ा', 'कम कर', 'बंद कर', 'ज्यादा', 'डबल'].map(norm);

function hasAny(text, list) {
    return list.some((w) => text.includes(w));
}

function checkDosageChange(speechText) {
    const t = norm(speechText);
    if (hasAny(t, DOSE_WORDS)) return true;
    return hasAny(t, MED_WORDS) && hasAny(t, CHANGE_WORDS);
}

module.exports = { checkDosageChange };