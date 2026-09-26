/**
 * Track B — Task 2.5: extraction diff engine.
 *
 * Run with:  npm run test:trackb
 */

import { assert, suite, test } from './harness';

import {
  buildFieldDiff,
  isFieldCorrected,
  correctionCount,
  isDosageCorrection,
  type ExtractedSnapshot
} from '../extractionDiff';

suite('extractionDiff');

const snapshot: ExtractedSnapshot = {
  medicineName: 'Tab Telmisartan',
  dosage: '40 mg',
  frequency: 'Once Daily (Morning)',
  nextTriggerTime: '08:00 AM',
  instruction: '1 tablet every morning'
};

test('an untouched item produces no diff', () => {
  assert.equal(buildFieldDiff(snapshot, { ...snapshot }).length, 0);
});

test('an item with no snapshot produces no diff (manually added row)', () => {
  assert.equal(buildFieldDiff(undefined, { ...snapshot }).length, 0);
});

test('a single field edit is reported with both values retained', () => {
  const diff = buildFieldDiff(snapshot, { ...snapshot, medicineName: 'Tab Telmisartan 40mg' });
  assert.equal(diff.length, 1);
  assert.equal(diff[0].field, 'medicineName');
  assert.equal(diff[0].label, 'Medicine');
  assert.equal(diff[0].extractedValue, 'Tab Telmisartan');
  assert.equal(diff[0].currentValue, 'Tab Telmisartan 40mg');
});

test('a strength edit is flagged as a dosage correction (Rule #1)', () => {
  const diff = buildFieldDiff(snapshot, { ...snapshot, dosage: '80 mg' });
  assert.equal(diff.length, 1);
  assert.equal(diff[0].field, 'dosage');
  assert.ok(isDosageCorrection(diff), 'dosage edit must raise the dosage guardrail');
});

test('a medicine-name edit is not a dosage correction', () => {
  const diff = buildFieldDiff(snapshot, { ...snapshot, medicineName: 'Tab Amlodipine' });
  assert.equal(isDosageCorrection(diff), false);
});

test('whitespace-only differences are not corrections', () => {
  assert.equal(buildFieldDiff(snapshot, { ...snapshot, medicineName: 'Tab Telmisartan  ' }).length, 0);
  assert.equal(
    buildFieldDiff(snapshot, { ...snapshot, instruction: '1 tablet every   morning' }).length,
    0
  );
});

test('comparison is case-insensitive', () => {
  assert.equal(buildFieldDiff(snapshot, { ...snapshot, medicineName: 'tab telmisartan' }).length, 0);
});

test('multiple field edits are all reported and counted', () => {
  const current = {
    ...snapshot,
    dosage: '80 mg',
    frequency: 'Twice Daily (Morning & Night)',
    nextTriggerTime: '08:30 AM'
  };
  const diff = buildFieldDiff(snapshot, current);
  assert.equal(diff.length, 3);
  assert.equal(correctionCount(snapshot, current), 3);
  assert.ok(isDosageCorrection(diff));
});

test('isFieldCorrected identifies only genuinely changed fields', () => {
  assert.equal(isFieldCorrected(snapshot, 'dosage', '80 mg'), true);
  assert.equal(isFieldCorrected(snapshot, 'frequency', 'Once Daily (Morning)'), false);
});

test('reverting a field restores parity with the OCR reading', () => {
  const corrected = { ...snapshot, dosage: '80 mg', frequency: 'At Bedtime (Night)' };
  assert.equal(buildFieldDiff(snapshot, corrected).length, 2);

  const reverted = {
    ...corrected,
    dosage: snapshot.dosage,
    frequency: snapshot.frequency
  };
  assert.equal(buildFieldDiff(snapshot, reverted).length, 0);
});

test('an emptied field still counts as a correction', () => {
  const diff = buildFieldDiff(snapshot, { ...snapshot, instruction: '' });
  assert.equal(diff.length, 1);
  assert.equal(diff[0].currentValue, '');
});
