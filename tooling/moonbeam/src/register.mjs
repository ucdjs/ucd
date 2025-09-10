/**
 * Convenience register script that can be used with --import
 * Usage: node --import @ucdjs/moonbeam/register your-script.ts
 */

import { register } from 'node:module';

// Register our custom loader
register('./esm-loader.mjs', import.meta.url);