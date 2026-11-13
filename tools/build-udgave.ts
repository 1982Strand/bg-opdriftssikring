import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'vite';
import { packPdfMotor } from './pak-pdf-motor.ts';

export async function buildEdition(edition: 'intern' | 'offentlig'): Promise<void> {
  process.env.VITE_UDGAVE = edition;
  const outDir = resolve(`dist-${edition}`);
  await build({ build: { outDir, emptyOutDir: true } });
  await packPdfMotor(outDir);
}

async function main() {
  const edition = process.argv[2];
  if (edition !== 'intern' && edition !== 'offentlig')
    throw new Error('Angiv udgaven: intern eller offentlig.');
  if (process.argv.length !== 3) throw new Error('Brug: node tools/build-udgave.ts <intern|offentlig>.');
  await buildEdition(edition);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main();
