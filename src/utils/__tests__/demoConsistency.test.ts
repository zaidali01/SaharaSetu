/**
 * Track D — demo consistency.
 *
 * `docs/demo_scenario.md` is the locked judging script. These assertions exist to stop
 * the dashboard from quietly contradicting it again: the chemist order previously
 * shipped "Metformin + Amlodipine, ₹340" while the OCR pipeline extracted
 * "Telmisartan 40mg + Amlodipine 5mg", so the on-stage WhatsApp message named a
 * molecule that had never been prescribed.
 *
 * Run with:  npm run test:trackb
 */

import { assert, suite, test } from './harness';

import {
  INITIAL_TASKS,
  INITIAL_PARENTS,
  INITIAL_DOCUMENTS,
  type KanbanTask
} from '../../data/mockData';

suite('demo consistency');

const chemistTask = INITIAL_TASKS.find(t => Boolean(t.whatsappDraft)) as KanbanTask | undefined;

/** Molecules present on the order, normalised for comparison. */
function orderedMolecules(task: KanbanTask): string[] {
  const items = task.whatsappDraft?.items ?? [];
  return items.map(i => i.name.replace(/\s*\(.*\)$/, '').trim().toLowerCase());
}

/** Molecules the OCR engine actually extracted from the prescription. */
function extractedMolecules(): string[] {
  return INITIAL_DOCUMENTS[0].extractedItems.map(i => i.name.toLowerCase());
}

test('a chemist order exists to assert against', () => {
  assert.ok(chemistTask, 'expected a task carrying a whatsappDraft');
});

test('the order total equals the sum of its line items', () => {
  const total = (chemistTask!.whatsappDraft?.items ?? []).reduce(
    (sum, i) => sum + i.estimatedPrice,
    0
  );
  assert.equal(total, chemistTask!.amount);
});

test('every ordered line appears in the Hindi message', () => {
  const hindi = chemistTask!.whatsappDraft?.messageHindi ?? '';
  for (const item of chemistTask!.whatsappDraft?.items ?? []) {
    assert.ok(hindi.includes(item.name.split(' (')[0]), `Hindi message omits ${item.name}`);
  }
});

test('every ordered line appears in the English message', () => {
  const english = chemistTask!.whatsappDraft?.messageEnglish ?? '';
  for (const item of chemistTask!.whatsappDraft?.items ?? []) {
    assert.ok(english.includes(item.name.split(' (')[0]), `English message omits ${item.name}`);
  }
});

test('the stated amount appears in both messages', () => {
  const amount = String(chemistTask!.amount);
  assert.ok((chemistTask!.whatsappDraft?.messageHindi ?? '').includes(amount));
  assert.ok((chemistTask!.whatsappDraft?.messageEnglish ?? '').includes(amount));
});

test('REGRESSION: nothing is ordered that the prescription did not prescribe', () => {
  const extracted = extractedMolecules();
  for (const ordered of orderedMolecules(chemistTask!)) {
    assert.ok(
      extracted.some(med => ordered.includes(med) || med.includes(ordered)),
      `ordered "${ordered}" does not appear on the extracted prescription (${extracted.join(', ')})`
    );
  }
});

test('REGRESSION: no legacy demo molecule survives on the order', () => {
  const ordered = orderedMolecules(chemistTask!).join(' | ');
  for (const stale of ['metformin', 'atorvastatin', 'shellcal', 'sitagliptin', 'valsartan']) {
    assert.ok(!ordered.includes(stale), `order still lists stale molecule "${stale}"`);
  }
});

test('the locked demo order is Telmisartan at the locked price', () => {
  // docs/demo_scenario.md §2 Step 3: "1 पत्ता Telmisartan 40mg ... राशि: ₹180"
  const ordered = orderedMolecules(chemistTask!);
  assert.equal(chemistTask!.amount, 180);
  assert.ok(
    ordered.some(m => m.includes('telmisartan 40mg')),
    `expected Telmisartan 40mg on the order, got ${ordered.join(', ')}`
  );
});

test('the adherence card matches the locked evening BP slot', () => {
  // The locked script opens on "क्या आपने अपनी शाम वाली बीपी की गोली ली?" and the
  // locked prescription makes Amlodipine the 08:00 PM dose.
  const adherence = INITIAL_TASKS.find(t => t.category === 'medication' && t.column === 'done');
  assert.ok(adherence, 'expected a completed medication task');
  assert.ok(/evening/i.test(adherence!.title), `expected an evening dose card, got "${adherence!.title}"`);
  assert.ok(!/morning/i.test(adherence!.title), 'Amlodipine must not be labelled as the morning dose');
});

test('the demo parent is a single consistent identity', () => {
  const p = INITIAL_PARENTS[0];
  assert.ok(p.name && p.address && p.city);
  assert.ok(p.vendors.chemist.name, 'chemist vendor missing');
});
