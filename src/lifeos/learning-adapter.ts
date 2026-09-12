import * as fs from 'node:fs';
import * as path from 'node:path';
import { addCandidate, listCandidates, showCandidate } from '../site-memory/candidates.js';
import { BreethService } from './breeth-service.js';
import { GoalPlanner } from './goal-planner.js';
import { LIFEOS_DIR } from './profile-store.js';
import type { BreethRecoveryRecord, RecoveryTactic } from './types.js';

export const STRATEGIES_CACHE_FILE = path.join(LIFEOS_DIR, 'strategies.json');

export interface LearningAdapterOptions {
  homeDir?: string;
  breethService?: BreethService;
  breethTimeoutMs?: number;
}

/**
 * LearningAdapter bridges LifeOS recovery execution with memory systems:
 * 1. Local Cache (`~/.webcmd/lifeos/strategies.json`): Fast, zero-latency offline fallback.
 * 2. Webcmd Native Site-Memory (`candidates/`): Git-backed provenance and audit.
 * 3. Breeth Semantic Memory: Cross-domain reasoning and long-term recovery strategy retrieval.
 */
export class LearningAdapter {
  private homeDir?: string;
  private breethService: BreethService;
  private breethTimeoutMs: number;

  constructor(opts?: LearningAdapterOptions) {
    this.homeDir = opts?.homeDir;
    this.breethTimeoutMs = opts?.breethTimeoutMs ?? 3500;
    this.breethService =
      opts?.breethService ??
      new BreethService({
        timeoutMs: this.breethTimeoutMs,
      });
  }

  /**
   * Exposes the underlying BreethService instance.
   */
  getBreethService(): BreethService {
    return this.breethService;
  }

  private getCachePath(): string {
    if (this.homeDir) {
      return path.join(this.homeDir, '.webcmd', 'lifeos', 'strategies.json');
    }
    return STRATEGIES_CACHE_FILE;
  }

  /**
   * Persists a successful recovery strategy into:
   * 1. Local LifeOS cache (immediate offline availability)
   * 2. Webcmd native site-memory candidates (provenance tracking)
   * 3. Breeth episodic memory (cross-domain semantic retrieval)
   * 
   * Local persistence is always completed first; Breeth errors never fail the workflow.
   */
  async recordSuccessfulRecovery(tactic: RecoveryTactic): Promise<void> {
    // 1. Always update fast local cache first
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

    // 3. Asynchronously persist recovery episode to Breeth semantic memory
    try {
      const atsType = GoalPlanner.detectAts(tactic.domain);
      const breethRecord: BreethRecoveryRecord = {
        id: tactic.strategyId,
        domain: tactic.domain,
        atsType,
        classification: tactic.classification,
        symptom: tactic.triggerPattern,
        failedSelector: tactic.fallbackSelector,
        recoveryAction: tactic.recoveryAction,
        remedy: tactic.remedyCode || tactic.description,
        fallbackSelector: tactic.fallbackSelector,
        alternativeSelectors: tactic.alternativeSelectors,
        outcome: 'recovered',
        confidence: tactic.confidence ?? 0.85,
        lessonLearned: tactic.description,
        metadata: {
          savedAt: new Date().toISOString(),
          triggerPattern: tactic.triggerPattern,
          homeDir: this.homeDir ? 'custom' : 'default',
        },
      };

      await this.breethService.saveRecoveryStrategy(breethRecord);
    } catch {
      // Breeth failure must never affect local workflow completion
    }
  }

  /**
   * Retrieves previously learned recovery strategies for a domain:
   * 1. Reads local LifeOS cache (fast zero-latency offline memory).
   * 2. Reads Webcmd site-memory candidates if available.
   * 3. Queries Breeth for semantically matched strategies (with bounded timeout).
   * 4. Merges, deduplicates, and ranks by confidence/relevance.
   */
  async getLearnedRecoveryStrategies(domain: string): Promise<RecoveryTactic[]> {
    const collected: RecoveryTactic[] = [];

    // 1. Read from local LifeOS cache (always fast and offline-ready)
    const cached = this.loadFromLocalCache();
    for (const item of cached) {
      if (item.domain === domain || domain.includes(item.domain) || item.domain.includes(domain)) {
        collected.push(item);
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
            collected.push(tactic);
          } catch {}
        }
      }
    } catch {
      // Offline fallback to cached
    }

    // 3. Query Breeth semantic memory (bounded by timeout)
    try {
      const atsType = GoalPlanner.detectAts(domain);
      const breethResults = await this.breethService.queryRecoveryStrategies({
        domain,
        atsType,
        limit: 10,
      });

      for (const res of breethResults) {
        const tactic: RecoveryTactic = {
          strategyId: res.strategyId,
          domain: res.domain,
          classification: res.classification,
          triggerPattern: res.triggerPattern,
          description: res.description,
          recoveryAction: (res.recoveryAction as any) || 'RETRY_WITH_FALLBACK_SELECTOR',
          fallbackSelector: res.fallbackSelector,
          alternativeSelectors: res.alternativeSelectors,
          remedyCode: res.remedyCode,
          confidence: Math.max(res.confidence ?? 0.8, res.relevanceScore ?? 0),
        };
        collected.push(tactic);
      }
    } catch {
      // Breeth network/API errors gracefully fall back to local results
    }

    // 4. Merge, deduplicate, and sort by highest confidence / relevance
    return this.deduplicateAndRank(collected);
  }

  /**
   * Deduplicates recovery strategies and sorts them in descending order of confidence.
   */
  private deduplicateAndRank(tactics: RecoveryTactic[]): RecoveryTactic[] {
    const map = new Map<string, RecoveryTactic>();

    for (const t of tactics) {
      const key = this.generateDedupeKey(t);
      const existing = map.get(key);

      if (!existing) {
        map.set(key, t);
      } else {
        // Keep the record with higher confidence or more specific remedyCode
        const currentConf = t.confidence ?? 0;
        const existingConf = existing.confidence ?? 0;
        if (currentConf > existingConf || (!existing.remedyCode && t.remedyCode)) {
          map.set(key, t);
        }
      }
    }

    return Array.from(map.values()).sort((a, b) => (b.confidence ?? 0) - (a.confidence ?? 0));
  }

  private generateDedupeKey(t: RecoveryTactic): string {
    if (t.remedyCode && t.remedyCode.trim().length > 0) {
      return `code:${t.domain}:${t.classification}:${t.remedyCode.trim()}`;
    }
    return `pattern:${t.domain}:${t.classification}:${t.triggerPattern}:${t.recoveryAction}`;
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

  clearLocalCache(): void {
    const file = this.getCachePath();
    if (fs.existsSync(file)) {
      try {
        fs.unlinkSync(file);
      } catch {}
    }
  }
}

