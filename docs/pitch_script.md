# Live Pitch Script (Task 4.2d)

Ties each screen to a judging-rubric point. Timings match `docs/demo_scenario.md` §5.
Target: 3 minutes. **Bold** = say this near-verbatim. Everything else is stage direction.

> Rule for the whole pitch: never claim the AI decided anything. Every sentence should
> make the *human* sound more powerful, not the model.

---

## 0:00 – 0:30 · Problem framing (Person 4)

**Screen: landing / parent profile.**

> "This is Ramakant Mishra. He is 72. He lives in Kankarbagh, Patna. His son works in
> Bangalore, nine hundred kilometres away in another time zone."

> "Ramakant is not incapable. He can absolutely take his tablet. What he cannot do is
> *manage a system*. Nobody sits him down every month to photograph a prescription,
> count the strips, and call a chemist."

> "So today the refill either happens by luck, or his son spends a Sunday on calls
> he feels guilty about not making. Sahay AI is the layer in between."

**Rubric point:** empathy and problem definition.
**Do not** open with the tech stack.

---

## 0:30 – 1:00 · Document Intake + the human gate (Person 4 & Person 2)

**Screen: Document Intake tab.**

> "Ramakant's cardiologist sends a prescription. Here it is."

*(Upload `ocr_service/samples/dr_verma_prescription_pmch.png` — the same image the
tests run against, so what you show is what we test.)*

> "Our vision pipeline reads it in Hindi or English and pulls out two medicines:
> Telmisartan 40mg in the morning, Amlodipine 5mg in the evening. Four days of stock left."

**Now stop and say the important sentence:**

> "Here is what I want you to notice. It did not just extract the medicines — it
> extracted what it *could not read*."

> "If the handwriting is illegible, this system does not guess. It writes down zero
> percent confidence and refuses to pass it. A guessed dosage is worse than no
> dosage, because a human will trust it."

*(Point at the Diff control. Change the Amlodipine slot to the morning by mistake on
purpose, then hit revert.)*

> "And this is the part I think matters most. Every field the child touches is diffed
> against the machine's original reading, and both versions are kept. So six months
> later we can answer: *did the AI get this wrong, or did we?* Without that, there is
> no way to ever trust the system enough to leave it running."

**Rubric points:** human-in-the-loop, zero hallucination, auditability.
**Person 2's line, if asked:** *"Our confidence comes from the actual OCR engine.
We removed every hardcoded default — a missing score is recorded as 0, never 0.95."*

---

## 1:00 – 1:50 · Live call + WhatsApp dispatch (Person 1 & Person 4)

**Screen: Agent Trace, then the live call.**

> "Four days of stock. Our planner decides this is the moment to check in, and calls
> Ramakant in Hindi."

*(Live call runs. Do not narrate over it — let the room hear the Hindi.)*

> "He confirms the evening pill. The agent reminds him Telmisartan is running out and
> asks permission to order from his usual chemist at Sharma Medical Hall."

> "Ramakant says yes. The action-taker drafts the WhatsApp order."

*(Show the WhatsApp preview — 1 strip Telmisartan 40mg, ₹180.)*

> "One pack. One price. Sent in Hindi, to the chemist he already trusts, with his
> exact address."

**Rubric point:** live real-world execution.
**If the call fails on stage** — go straight to `4.1d` backup video. Do not debug live.

---

## 1:50 – 2:30 · Status board + guardrails (Person 4 & Person 3)

**Screen: Command Board, three columns.**

> "Everything the system does lands on one board. Three columns: Done and verified,
> Needs your approval, Blocked."

> "The middle column is the whole product. The chemist order is sitting there and it
> is *not* going to happen until Priya, nine hundred kilometres away, taps Approve.
> No amount of confidence from our model can skip that button."

*(Open the Guardrails modal and run the payment test live.)*

> "Now watch what happens if the system tries to get ahead of itself. I am asking it to
> pay three hundred rupees that nobody approved."

*(It blocks. Let the room read the reason.)*

> "Blocked. And the same guardrail refuses dosage changes coming back from the call —
> because the doctor wrote that prescription, not the agent."

> "And every automated step, successful or refused, is written to a log with a
> timestamp and an actor. If this system ever does something a family did not expect,
> we can reconstruct exactly who did what and when."

**Rubric points:** non-autonomous payments, safety guardrails, action logging.

---

## 2:30 – 3:00 · Close (All)

> "Sahay AI does not replace the child. It replaces the Sunday phone call."

> "The parent gets a voice call in their language. The child gets a phone that only
> rings when their attention is actually needed. And the medicine is never changed,
> never ordered, and never paid for without a human saying yes."

**Rubric point:** polish and confidence.

---

## If a judge asks the hard questions

| Question | Short answer | Who answers |
|---|---|---|
| "What if the OCR is wrong?" | It is flagged at 0% confidence and blocked from activation. The child reviews the original paper. Every edit is diffed. | Person 2 |
| "Can it change a dose?" | No. Dosage changes are refused in both the call flow and the review UI, and logged as a refusal. | Person 3 |
| "Can it spend money?" | Only after explicit per-transaction approval, and only under a cap. Both enforced server-side. | Person 3 |
| "What data do you store?" | Medication names, schedule, call transcripts, timestamps. No payment credentials. | Person 3 |
| "Does it work offline?" | The OCR engine has a grounded local fallback, so a network drop degrades rather than crashes. | Person 2 |
| "How do you know it works?" | 14 pipeline tests against the real sample documents, 36 frontend tests, and backend guardrail tests, all re-runnable with one command. | Person 2 |
| "Why should a parent trust a call?" | It never asks them to make a decision. It confirms a dose, and asks permission for a refill they were going to need anyway. | Person 1 |

---

## Rehearsal checklist (Task 4.4d — run 3× before demo day)

- [ ] `npm run verify:trackb` green on the demo machine
- [ ] Backend up and reporting `connected` (the board shows a live sync)
- [ ] Sample prescription opens from `ocr_service/samples/`
- [ ] Diff toggle produces a visible correction, and revert restores it
- [ ] Evening dose still reads **08:00 PM** — this was a real bug, check it every time
- [ ] Chemist order reads **Telmisartan 40mg, ₹180** in both the card and the WhatsApp preview
- [ ] Guardrail demo blocks the unapproved ₹300
- [ ] Backup video (`4.1d`) plays on a spare laptop, audio off, subtitles on
- [ ] Phone on silent, ringer on, one spare charged handset ready
