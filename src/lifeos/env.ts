import * as fs from 'node:fs';
import * as path from 'node:path';

let envLoaded = false;

/**
 * Loads environment variables from `.env.local` and `.env` files if present.
 * Priority: Existing process.env > `.env.local` > `.env`.
 */
export function loadLifeOsEnv(workspaceDir?: string): Record<string, string> {
  const loaded: Record<string, string> = {};
  const searchDirs = [
    workspaceDir,
    process.cwd(),
    path.resolve(process.cwd(), '..'),
  ].filter((d): d is string => Boolean(d && fs.existsSync(d)));

  const candidateFiles = ['.env.local', '.env'];

  for (const dir of searchDirs) {
    for (const filename of candidateFiles) {
      const filePath = path.join(dir, filename);
      if (fs.existsSync(filePath)) {
        try {
          const content = fs.readFileSync(filePath, 'utf-8');
          const lines = content.split(/\r?\n/);
          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith('#')) continue;
            const eqIdx = trimmed.indexOf('=');
            if (eqIdx > 0) {
              const key = trimmed.slice(0, eqIdx).trim();
              let val = trimmed.slice(eqIdx + 1).trim();
              if (
                (val.startsWith('"') && val.endsWith('"')) ||
                (val.startsWith("'") && val.endsWith("'"))
              ) {
                val = val.slice(1, -1);
              }
              if (!process.env[key]) {
                process.env[key] = val;
              }
              loaded[key] = process.env[key] || val;
            }
          }
        } catch {
          // Non-blocking file read error
        }
      }
    }
  }

  envLoaded = true;
  return loaded;
}

// Auto-run once on module import
if (!envLoaded) {
  loadLifeOsEnv();
}
