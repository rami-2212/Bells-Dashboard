#!/usr/bin/env node
const fs   = require('fs');
const path = require('path');
const pool = require('./pool');

const SEEDS_DIR = path.join(__dirname, 'seeds');

async function runSeeds() {
  const client = await pool.connect();
  try {
    const files = fs.readdirSync(SEEDS_DIR)
      .filter(f => f.endsWith('.sql'))
      .sort();

    for (const file of files) {
      const sql = fs.readFileSync(path.join(SEEDS_DIR, file), 'utf8');
      console.log(`[SEED] Running: ${file}`);
      await client.query(sql);
      console.log(`[SEED] Done: ${file}`);
    }
    console.log('[SEED] All seeds complete.');
  } catch (err) {
    console.error('[SEED] Error:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

runSeeds();
