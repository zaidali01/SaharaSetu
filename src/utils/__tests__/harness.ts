/**
 * Minimal zero-dependency test harness.
 *
 * The repo has no JS test runner configured and this project must not gain one just
 * for Track B, so these pure-TS utilities are verified with a ~40 line harness driven
 * by the already-installed `sucrase-node` (which strips types at require time).
 *
 * Run with:  npm run test:trackb
 */

import assert from 'node:assert/strict';

interface Case {
  name: string;
  fn: () => void;
}

const cases: Case[] = [];
let currentSuite = 'default';

export function suite(name: string): void {
  currentSuite = name;
}

export function test(name: string, fn: () => void): void {
  cases.push({ name: `${currentSuite} › ${name}`, fn });
}

export { assert };

export function run(): void {
  let passed = 0;
  const failures: { name: string; err: unknown }[] = [];

  for (const c of cases) {
    try {
      c.fn();
      passed++;
      console.log(`  [32m✓[0m ${c.name}`);
    } catch (err) {
      failures.push({ name: c.name, err });
      console.log(`  [31m✗[0m ${c.name}`);
    }
  }

  console.log('');
  if (failures.length > 0) {
    console.log(`[31m${failures.length} failing[0m, ${passed} passing\n`);
    for (const f of failures) {
      const err = f.err as Error;
      console.log(`[31m${f.name}[0m`);
      console.log(`  ${(err?.message ?? String(err)).split('\n').join('\n  ')}\n`);
    }
    process.exit(1);
  }

  console.log(`[32m${passed} passing[0m\n`);
}
