
# SaharaSetu — Demo Call Script (Person 1)

Scenario: BP medicine refill + gas cylinder check, in Hindi.

## Flow

**1. GREETING** (agent speaks, no response needed)

- HI: "Namaste! Main {child_name} ki taraf se baat kar raha hoon. Aapse do minute baat karni hai."
- EN: "Hi! I'm calling on behalf of {child_name}. Need two minutes of your time."

**2. MEDICINE_CHECK**

- HI: "Aapki BP ki dawai ab sirf {days_left} din ki bachi hai. Kya main {chemist_name} ko order bhej doon?"
- EN: "Your BP medicine has only {days_left} days left. Should I send an order to {chemist_name}?"

| Parent says                | System does                                     |
| -------------------------- | ----------------------------------------------- |
| Haan / Bhej do / Theek hai | Send WhatsApp order → mark "awaiting approval" |
| Nahi / Abhi mat            | Mark "deferred"                                 |
| Unclear / silence          | Repeat once, then offer keypad (1=yes, 2=no)    |
| Distress phrase            | Skip everything, escalate to child immediately  |

**3. GAS_BOOKING_CHECK**

- HI: "Gas cylinder ka kya haal hai? Khatam hone wala hai ya abhi theek hai?"
- EN: "How's the gas cylinder? Running low or still fine?"

| Parent says                  | System does                              |
| ---------------------------- | ---------------------------------------- |
| Khatam ho raha hai / Kam hai | Draft gas booking → "awaiting approval" |
| Theek hai                    | Mark "done", no action                   |
| Unclear / silence            | Repeat once, then keypad (1=low, 2=fine) |
| Distress phrase              | Escalate immediately                     |

**4. CLOSING**

- HI: "Theek hai, main {child_name} ko bata dunga sab kuch. Dhyan rakhiye. Namaste."
- EN: "Okay, I'll let {child_name} know everything. Take care. Bye."
- Log full transcript + every action taken.

## Distress keywords (hardcoded, short list — do not expand without testing)

theek nahi · tabiyat kharab · dard · bukhar · gir gaya · gir gayi · madad

## No-answer handling

2 missed call attempts → escalate to child as a missed-call alert.

## Guardrails (non-negotiable, test in Phase 3)

- Never change dosage or give medical advice
- Never trigger payment without child's approval
- Every action logged with timestamp + actor + result

## Variables to fill before demo

- {child_name} — placeholder or real name?
- {chemist_name} — e.g. "Sharma Medical"
- {days_left} — hardcode a number for the demo (e.g. 4)
