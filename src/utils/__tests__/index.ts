/**
 * Track B test entry point.
 *
 * Run with:  npm run test:trackb
 */

import { run } from './harness';
import './extractionDiff.test';
import './clinicalNormalizer.test';

run();
