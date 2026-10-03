import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool } from '../config/db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const schemaDir = path.resolve(__dirname, '../../../database/schema');

/**
 * Splits a SQL file into individual statements on top-level `;` boundaries,
 * respecting single-quoted strings. Each statement is then run as its own
 * query (its own implicit transaction) rather than one multi-statement blob —
 * required because Postgres forbids `ALTER TYPE ... ADD VALUE` inside a
 * transaction block that contains other statements.
 */
function splitStatements(sql) {
  const statements = [];
  let current = '';
  let inString = false;
  for (let i = 0; i < sql.length; i++) {
    const ch = sql[i];
    current += ch;
    if (ch === "'") inString = !inString;
    if (ch === ';' && !inString) {
      const trimmed = current.trim();
      if (trimmed) statements.push(trimmed);
      current = '';
    }
  }
  if (current.trim()) statements.push(current.trim());
  return statements;
}

async function run() {
  const files = fs.readdirSync(schemaDir).filter((f) => f.endsWith('.sql')).sort();
  console.log(`Found ${files.length} schema file(s) in ${schemaDir}`);

  await pool.query(`
    create table if not exists _migrations (
      name text primary key,
      applied_at timestamptz not null default now()
    );
  `);

  const { rows } = await pool.query('select name from _migrations');
  const applied = new Set(rows.map((r) => r.name));

  for (const file of files) {
    if (applied.has(file)) {
      console.log(`skip (already applied): ${file}`);
      continue;
    }
    const sql = fs.readFileSync(path.join(schemaDir, file), 'utf8');
    console.log(`applying: ${file}`);
    const statements = splitStatements(sql);
    for (const statement of statements) {
      try {
        await pool.query(statement);
      } catch (err) {
        // Enum values / columns already present (re-run safety) — log and continue.
        if (err.code === '42710' || err.code === '42701') {
          console.log(`  (already exists, skipping) ${statement.slice(0, 60)}...`);
        } else {
          throw err;
        }
      }
    }
    await pool.query('insert into _migrations (name) values ($1)', [file]);
  }

  console.log('Migrations complete.');
  await pool.end();
}

run().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
