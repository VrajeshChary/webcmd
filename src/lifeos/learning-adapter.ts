import * as fs from 'node:fs';
import * as path from 'node:path';
import { addCandidate, listCandidates, showCandidate } from '../site-memory/candidates.js';
import { LIFEOS_DIR } from './profile-store.js';
import type { RecoveryTactic } from './types.js';

export const STRATEGIES_CACHE_FILE = path.join(LIFEOS_DIR, 'strategies.json');

export class LearningAdapter {
  private homeDir?: string;

  constructor(opts?: { homeDir?: string }) {
    this.homeDir = opts?.homeDir;
  }

  private getCachePath(): string {
    if (this.homeDir) {
      return path.join(this.homeDir, '.webcmd', 'lifeos', 'strategies.json');
    }
    return STRATEGIES_CACHE_FILE;
  }

  /**
   * Persists a successful recovery strategy into Webcmd's native site-memory
   * and local LifeOS cache.
   */
  async recordSuccessfulRecovery(tactic: RecoveryTactic): Promise<void> {
    // 1. Always update fast local cache
    this.saveToLocalCache(tactic);

    // 2. Attempt persistence to Webcmd native site-memory
    try {
      await addCandidate({
        product: tactic.domain,
        hostname: tactic.domain,
        kind: 'recovery_strategy',
        claim: `[recovery:${tactic.classification}] ${tactic.description}`,
        evidence: JSON.stringify({
          trigger: tactic.triggerPattern,
          action: tactic.recoveryAction,
          fallbackSelector: tactic.fallbackSelector,
          remedyCode: tactic.remedyCode,
        }),
        consequence: `Successfully recovered workflow on ${tactic.domain} without aborting application flow.`,
        homeDir: this.homeDir,
      });
    } catch {
      // Memory persistence should never fail the user workflow
    }
  }

  /**
   * Retrieves previously learned recovery strategies for a domain.
   */
  async getLearnedRecoveryStrategies(domain: string): Promise<RecoveryTactic[]> {
    const tactics: RecoveryTactic[] = [];

    // 1. Read from local LifeOS cache
    const cached = this.loadFromLocalCache();
    for (const item of cached) {
      if (item.domain === domain || domain.includes(item.domain) || item.domain.includes(domain)) {
        tactics.push(item);
      }
    }

    // 2. Query native site-memory candidates if available
    try {
      const candidates = await listCandidates(domain, { homeDir: this.homeDir });
      for (const summary of candidates) {
        if (summary.kind === 'recovery_strategy') {
          const detail = await showCandidate(domain, summary.id, { homeDir: this.homeDir });
          try {
            const parsed = JSON.parse(detail.evidence);
            const tactic: RecoveryTactic = {
              strategyId: detail.id,
              domain: detail.domain,
              classification: (detail.claim.match(/\[recovery:([^\]]+)\]/)?.[1] || 'SELECTOR_DRIFT') as any,
              triggerPattern: parsed.trigger || '',
              description: detail.claim.replace(/\[recovery:[^\]]+\]\s*/, ''),
              recoveryAction: parsed.action || 'RETRY_WITH_FALLBACK_SELECTOR',
              fallbackSelector: parsed.fallbackSelector,
              remedyCode: parsed.remedyCode,
              confidence: 0.9,
            };
            if (!tactics.some((t) => t.strategyId === tactic.strategyId)) {
              tactics.push(tactic);
            }
          } catch {}
        }
      }
    } catch {
      // Offline fallback to cached
    }

    return tactics;
  }

  /**
   * Fast file cache operations
   */
  loadFromLocalCache(): RecoveryTactic[] {
    const file = this.getCachePath();
    if (!fs.existsSync(file)) return [];
    try {
      const content = fs.readFileSync(file, 'utf-8');
      return JSON.parse(content) as RecoveryTactic[];
    } catch {
      return [];
    }
  }

  saveToLocalCache(tactic: RecoveryTactic): void {
    const file = this.getCachePath();
    const dir = path.dirname(file);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const current = this.loadFromLocalCache();
    const existingIdx = current.findIndex(
      (t) => t.domain === tactic.domain && t.triggerPattern === tactic.triggerPattern
    );
    if (existingIdx >= 0) {
      current[existingIdx] = tactic;
    } else {
      current.push(tactic);
    }
    fs.writeFileSync(file, JSON.stringify(current, null, 2), 'utf-8');
  }
}
