import * as fs from 'node:fs';
import * as path from 'node:path';
import { LIFEOS_DIR } from './profile-store.js';
import type { ActionLogEntry, LifeOsRunResult, RecoveryTactic, UIChangeReport, WorkflowPhase } from './types.js';

export const LOGS_DIR = path.join(LIFEOS_DIR, 'logs');

export class ActionLogger {
  readonly runId: string;
  private entries: ActionLogEntry[] = [];
  private stepCounter = 0;
  private logsDirectory: string;

  constructor(runId?: string, customLogsDir?: string) {
    this.runId = runId || `run-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    this.logsDirectory = customLogsDir || LOGS_DIR;
  }

  getLogsDir(): string {
    return this.logsDirectory;
  }

  ensureDir(): void {
    if (!fs.existsSync(this.logsDirectory)) {
      fs.mkdirSync(this.logsDirectory, { recursive: true });
    }
  }

  log(
    phase: WorkflowPhase,
    stepName: string,
    action: string,
    outcome: 'success' | 'warning' | 'failure' | 'recovered',
    message: string,
    extra?: {
      target?: string;
      valuePreview?: string;
      uiChange?: UIChangeReport;
      recoveryAttempted?: RecoveryTactic;
    }
  ): ActionLogEntry {
    this.stepCounter++;
    const entry: ActionLogEntry = {
      timestamp: new Date().toISOString(),
      phase,
      stepIndex: this.stepCounter,
      stepName,
      action,
      outcome,
      message,
      target: extra?.target,
      valuePreview: extra?.valuePreview,
      uiChange: extra?.uiChange,
      recoveryAttempted: extra?.recoveryAttempted,
    };
    this.entries.push(entry);
    return entry;
  }

  getEntries(): ActionLogEntry[] {
    return [...this.entries];
  }

  writeArtifacts(result: Partial<LifeOsRunResult>): { jsonPath: string; markdownPath: string } {
    this.ensureDir();
    const jsonPath = path.join(this.logsDirectory, `${this.runId}.json`);
    const markdownPath = path.join(this.logsDirectory, `${this.runId}.md`);

    const fullPayload = {
      runId: this.runId,
      timestamp: new Date().toISOString(),
      result,
      entries: this.entries,
    };

    fs.writeFileSync(jsonPath, JSON.stringify(fullPayload, null, 2), 'utf-8');

    // Generate clean markdown report
    const mdLines = [
      `# LifeOS Agent Run Report: ${this.runId}`,
      ``,
      `- **Status**: \`${result.status || 'unknown'}\``,
      `- **Target URL**: ${result.url || 'N/A'}`,
      `- **Goal**: ${result.goal || 'N/A'}`,
      `- **Steps Executed**: ${this.entries.length}`,
      `- **Fields Filled**: ${result.fieldsFilled || 0}`,
      `- **Recoveries Applied**: ${result.recoveriesApplied || 0}`,
      ``,
      `## Timeline of Actions`,
      ``,
      `| # | Phase | Action | Target | Outcome | Details |`,
      `|---|---|---|---|---|---|`,
    ];

    for (const e of this.entries) {
      const outcomeBadge =
        e.outcome === 'success'
          ? '✅ success'
          : e.outcome === 'recovered'
          ? '🔁 recovered'
          : e.outcome === 'warning'
          ? '⚠️ warning'
          : '❌ failure';
      const cleanTarget = (e.target || '-').replace(/\|/g, '\\|');
      const cleanMsg = e.message.replace(/\|/g, '\\|');
      mdLines.push(
        `| ${e.stepIndex} | \`${e.phase}\` | ${e.action} | \`${cleanTarget}\` | ${outcomeBadge} | ${cleanMsg} |`
      );
    }

    if (result.learnedStrategies && result.learnedStrategies.length > 0) {
      mdLines.push(``, `## Learned Recovery Strategies`, ``);
      for (const strat of result.learnedStrategies) {
        mdLines.push(
          `- **${strat.classification}**: ${strat.description}`,
          `  - Trigger: \`${strat.triggerPattern}\``,
          `  - Action: \`${strat.recoveryAction}\``,
          `  - Fallback Selector: \`${strat.fallbackSelector || 'N/A'}\``
        );
      }
    }

    fs.writeFileSync(markdownPath, mdLines.join('\n'), 'utf-8');

    return { jsonPath, markdownPath };
  }

  static listLogs(customLogsDir?: string): Array<{ runId: string; date: string; path: string }> {
    const dir = customLogsDir || LOGS_DIR;
    if (!fs.existsSync(dir)) return [];
    try {
      const files = fs.readdirSync(dir).filter((f) => f.endsWith('.json'));
      return files
        .map((f) => {
          const runId = f.replace('.json', '');
          const stat = fs.statSync(path.join(dir, f));
          return {
            runId,
            date: stat.mtime.toISOString(),
            path: path.join(dir, f),
          };
        })
        .sort((a, b) => b.date.localeCompare(a.date));
    } catch {
      return [];
    }
  }

  static readLog(runId: string, customLogsDir?: string): Record<string, unknown> | null {
    const dir = customLogsDir || LOGS_DIR;
    const file = path.join(dir, `${runId}.json`);
    if (!fs.existsSync(file)) return null;
    try {
      return JSON.parse(fs.readFileSync(file, 'utf-8'));
    } catch {
      return null;
    }
  }
}
