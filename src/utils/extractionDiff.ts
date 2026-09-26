/**
 * Track B — Task 2.5: "What the child edited vs. what was extracted" diff logic.
 *
 * The anti-hallucination guarantee in SaharaSetu is that a child reviews every OCR
 * extraction before it goes live. That review is only meaningful if the system can
 * prove what the machine guessed versus what a human actually confirmed. This module
 * is the single source of truth for that comparison.
 */

export interface ExtractedSnapshot {
  medicineName: string;
  dosage: string;
  frequency: string;
  nextTriggerTime: string;
  instruction: string;
}

export type EditableField = keyof ExtractedSnapshot;

export interface FieldDiff {
  field: EditableField;
  label: string;
  extractedValue: string;
  currentValue: string;
}

export const EDITABLE_FIELDS: { key: EditableField; label: string }[] = [
  { key: 'medicineName', label: 'Medicine' },
  { key: 'dosage', label: 'Strength' },
  { key: 'frequency', label: 'Cadence' },
  { key: 'nextTriggerTime', label: 'Trigger Slot' },
  { key: 'instruction', label: 'Instruction' },
];

const normalizeForCompare = (value: string | undefined): string =>
  (value ?? '').trim().replace(/\s+/g, ' ').toLowerCase();

/**
 * Returns every field the child changed relative to the OCR snapshot.
 * An item the child never touched yields an empty array.
 */
export function buildFieldDiff(
  snapshot: ExtractedSnapshot | undefined,
  current: ExtractedSnapshot
): FieldDiff[] {
  if (!snapshot) return [];

  return EDITABLE_FIELDS.reduce<FieldDiff[]>((diffs, { key, label }) => {
    const extractedValue = snapshot[key] ?? '';
    const currentValue = current[key] ?? '';
    if (normalizeForCompare(extractedValue) !== normalizeForCompare(currentValue)) {
      diffs.push({ field: key, label, extractedValue, currentValue });
    }
    return diffs;
  }, []);
}

export function isFieldCorrected(
  snapshot: ExtractedSnapshot | undefined,
  field: EditableField,
  currentValue: string
): boolean {
  if (!snapshot) return false;
  return normalizeForCompare(snapshot[field]) !== normalizeForCompare(currentValue);
}

export function correctionCount(snapshot: ExtractedSnapshot | undefined, current: ExtractedSnapshot): number {
  return buildFieldDiff(snapshot, current).length;
}

/**
 * Dosage guardrail (Rule #1: immutable dosages).
 *
 * A correction to the strength field is treated as a safety-relevant event rather
 * than a cosmetic edit, because the agent must never be the party that changes a
 * molecule or a strength. Surfacing it separately lets the child see that they
 * personally overrode the OCR, with the machine's reading preserved alongside.
 */
export function isDosageCorrection(diff: FieldDiff[]): boolean {
  return diff.some(d => d.field === 'dosage');
}
