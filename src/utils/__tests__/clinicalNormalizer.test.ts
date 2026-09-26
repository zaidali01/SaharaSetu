/**
 * Track B — Clinical frequency normalizer.
 *
 * Guards the schedule slots that the locked demo depends on, plus the
 * non-clinical recurrence codes introduced for bills and pensions (Task 2.2).
 *
 * Run with:  npm run test:trackb
 */

import { assert, suite, test } from './harness';

import { normalizeFrequency } from '../clinicalNormalizer';

suite('clinicalNormalizer');

test('OD morning resolves to the morning slot', () => {
  const r = normalizeFrequency('Once Daily (Morning)');
  assert.equal(r.frequency, 'Once Daily (Morning)');
  assert.equal(r.frequencyCode, 'OD');
  assert.equal(r.triggerSlot, '08:00 AM Daily');
});

test('"1-0-0" prescription shorthand resolves to morning', () => {
  const r = normalizeFrequency('OD (1-0-0) (Morn PC)');
  assert.equal(r.frequency, 'Once Daily (Morning)');
  assert.equal(r.triggerSlot, '08:00 AM Daily');
});

test('REGRESSION: OD evening must not be rescheduled to the morning', () => {
  // "Once Daily (Evening)" contains "once daily", so the generic OD rule used to
  // win and silently move the evening dose to 08:00 AM.
  const r = normalizeFrequency('Once Daily (Evening)');
  assert.equal(r.frequency, 'Once Daily (Evening)');
  assert.equal(r.triggerSlot, '08:00 PM Daily');
  assert.ok(!r.triggerSlot.includes('AM'), 'evening dose must never land in the morning');
});

test('REGRESSION: "0-0-1" night shorthand resolves to the evening slot', () => {
  const r = normalizeFrequency('OD (0-0-1) (Night PC)');
  assert.equal(r.frequency, 'Once Daily (Evening)');
  assert.equal(r.triggerSlot, '08:00 PM Daily');
});

test('the two locked demo doses resolve to different slots', () => {
  const morning = normalizeFrequency('OD (1-0-0) (Morn PC)');
  const evening = normalizeFrequency('OD (0-0-1) (Night PC)');
  assert.notEqual(morning.triggerSlot, evening.triggerSlot);
});

test('BD resolves to both slots', () => {
  const r = normalizeFrequency('BD');
  assert.equal(r.frequency, 'Twice Daily (Morning & Night)');
  assert.equal(r.frequencyCode, 'BD');
  assert.ok(r.triggerSlot.includes('&'), `BD must carry two doses, got "${r.triggerSlot}"`);
  assert.ok(r.triggerSlot.includes('AM'), 'BD is missing its morning dose');
  assert.ok(r.triggerSlot.includes('PM'), 'BD is missing its evening dose');
});

test('REGRESSION: BD keeps its evening dose when one time is stated', () => {
  // A single-match regex collapsed this to "09:00 AM" alone, so a twice-daily
  // medicine only ever fired one alarm.
  const r = normalizeFrequency('BD 09:00 AM');
  assert.ok(r.triggerSlot.includes('09:00 AM'));
  assert.ok(r.triggerSlot.includes('&'), 'the second dose was dropped');
  assert.ok(r.triggerSlot.includes('PM'), 'the evening dose was dropped');
});

test('REGRESSION: an explicit evening time in BD keeps the morning dose', () => {
  const r = normalizeFrequency('BD 09:00 PM');
  assert.ok(r.triggerSlot.includes('09:00 PM'));
  assert.ok(r.triggerSlot.includes('AM'), 'the morning dose was dropped');
});

test('HS resolves to bedtime', () => {
  const r = normalizeFrequency('HS');
  assert.equal(r.frequency, 'At Bedtime (Night)');
  // Wording moved from "10:00 PM Bedtime" to "10:00 PM Tonight" for the IVR;
  // the invariant that matters is the time, not the phrasing.
  assert.ok(/^10:00 PM/.test(r.triggerSlot), `expected a 10:00 PM slot, got "${r.triggerSlot}"`);
});

test('SOS resolves to on-demand', () => {
  const r = normalizeFrequency('SOS');
  assert.equal(r.frequency, 'As Needed (SOS)');
  assert.equal(r.triggerSlot, 'On-Demand (SOS Trigger)');
});

test('bedtime is not mistaken for the OD evening slot', () => {
  const r = normalizeFrequency('HS at bedtime');
  assert.equal(r.frequency, 'At Bedtime (Night)');
});

test('QWK resolves to a weekly slot', () => {
  const r = normalizeFrequency('Once weekly on sunday');
  assert.equal(r.frequency, 'Once Weekly');
  assert.equal(r.frequencyCode, 'QWK');
});

test('TDS resolves to three slots', () => {
  const r = normalizeFrequency('TDS');
  assert.equal(r.frequencyCode, 'TDS');
  assert.equal(r.triggerSlot, '08:00 AM, 02:00 PM & 08:30 PM');
});

test('utility bills resolve to a MONTHLY cycle', () => {
  const r = normalizeFrequency('Monthly Recurring Cycle');
  assert.equal(r.frequency, 'Monthly Recurring Cycle');
  assert.equal(r.frequencyCode, 'MONTHLY');
  assert.equal(r.triggerSlot, '18th of Every Month');
});

test('pension deadlines resolve to a ONE_OFF cycle', () => {
  const r = normalizeFrequency('One-Off Deadline');
  assert.equal(r.frequency, 'One-Off Deadline');
  assert.equal(r.frequencyCode, 'ONE_OFF');
  assert.equal(r.triggerSlot, '30-Nov of Every Year');
});

test('an unrecognised cadence falls back to a safe default', () => {
  const r = normalizeFrequency('take it whenever');
  assert.equal(r.frequency, 'Once Daily (Morning)');
  assert.ok(r.triggerSlot.length > 0);
});

test('empty input does not throw', () => {
  assert.doesNotThrow(() => normalizeFrequency(''));
  assert.doesNotThrow(() => normalizeFrequency(undefined as unknown as string));
});
