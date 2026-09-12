import { Command } from 'commander';
import { addOutputFormatOption, outputFormatIsExplicit, resolveCommandOutputFormat } from '../command-surface.js';
import { render as renderOutput } from '../output.js';
import { ActionLogger } from './action-logger.js';
import { LifeOsAgent } from './agent-loop.js';
import { LearningAdapter } from './learning-adapter.js';
import { ProfileStore } from './profile-store.js';

export function registerLifeOsCommands(root: Command): Command {
  const lifeos = root.command('lifeos').description('Apply Anywhere — LifeOS adaptive browser agent');

  // ── 1. Apply Command ────────────────────────────────────────────────────────
  const applyCmd = addOutputFormatOption(
    lifeos
      .command('apply')
      .description('Execute an adaptive job application workflow from natural language goal or URL')
      .argument('[goal...]', 'Natural language goal, e.g. "Apply to Senior Engineer on Greenhouse"')
      .option('--url <url>', 'Target job application URL')
      .option('--profile <path>', 'Custom path to profile.json')
      .option('--resume <path>', 'Path to resume document')
      .option('--dry-run', 'Preview and fill form without submitting', false)
      .option('--auto-submit', 'Submit form automatically once filled', false)
      .option('--session <id>', 'Browser session to use')
      .option('-v, --verbose', 'Print verbose step details', false)
  );

  applyCmd.action(async (goalWords: string[], opts: any, command: Command) => {
    const rawGoal = goalWords.join(' ').trim() || (opts.url ? `Apply to job at ${opts.url}` : '');
    if (!rawGoal && !opts.url) {
      console.error('Error: Please provide a natural language goal or a target --url.');
      process.exitCode = 1;
      return;
    }

    const fmt = resolveCommandOutputFormat(command, opts.format);
    if (fmt === null) return;
    const fmtExplicit = outputFormatIsExplicit(command);

    if (!fmtExplicit) {
      console.log(`🤖 LifeOS Agent initializing...`);
      console.log(`🎯 Goal: "${rawGoal}"`);
      if (opts.url) console.log(`🔗 Target URL: ${opts.url}`);
    }

    const agent = new LifeOsAgent();
    const result = await agent.run({
      goal: rawGoal,
      url: opts.url,
      profilePath: opts.profile,
      resumePath: opts.resume,
      dryRun: opts.dryRun,
      autoSubmit: opts.autoSubmit,
      session: opts.session,
    });

    if (fmtExplicit) {
      await renderOutput(result, { fmt, fmtExplicit: true });
    } else {
      console.log();
      if (result.status === 'completed') {
        console.log(`✅ ${result.summary}`);
      } else {
        console.log(`⚠️ Status: ${result.status}`);
        console.log(`   ${result.summary}`);
      }
      console.log(`🆔 Run ID:              ${result.runId}`);
      console.log(`📋 Fields Populated:    ${result.fieldsFilled}`);
      console.log(`🔁 Recoveries Applied:  ${result.recoveriesApplied}`);
      console.log(`📜 Action Log Artifact: ${result.actionLogPath}`);
      if (result.learnedStrategies.length > 0) {
        console.log(`🧠 Learned Strategies:  ${result.learnedStrategies.length} new tactic(s) saved to site memory`);
      }
      console.log();
    }
  });

  // ── 2. Profile Management ───────────────────────────────────────────────────
  const profileCmd = lifeos.command('profile').description('Manage applicant profile, resume, and answers');

  profileCmd
    .command('init')
    .description('Initialize or reset standard applicant profile')
    .option('--path <path>', 'Custom destination path')
    .action((opts: any) => {
      const store = new ProfileStore(opts.path);
      const profile = store.initDefault();
      console.log(`✅ Initialized profile at: ${store.getProfilePath()}`);
      console.log(`   Candidate: ${profile.fullName} <${profile.email}>`);
    });

  const profileShowCmd = addOutputFormatOption(
    profileCmd.command('show').description('Display active applicant profile data')
  );
  profileShowCmd.action(async (opts: any, command: Command) => {
    const store = new ProfileStore();
    const profile = store.load();
    const fmt = resolveCommandOutputFormat(command, opts.format);
    if (fmt === null) return;
    if (outputFormatIsExplicit(command)) {
      await renderOutput(profile, { fmt, fmtExplicit: true });
    } else {
      console.log(`Applicant Profile: ${profile.fullName}`);
      console.log(`Email:     ${profile.email}`);
      console.log(`Phone:     ${profile.phone}`);
      console.log(`Location:  ${profile.location}`);
      console.log(`Company:   ${profile.currentCompany || 'N/A'}`);
      console.log(`Role:      ${profile.currentTitle || 'N/A'}`);
      console.log(`Skills:    ${(profile.skills || []).join(', ')}`);
      console.log(`File:      ${store.getProfilePath()}`);
    }
  });

  profileCmd
    .command('path')
    .description('Print profile file location')
    .action(() => {
      const store = new ProfileStore();
      console.log(store.getProfilePath());
    });

  // ── 3. Learned Strategies ───────────────────────────────────────────────────
  const stratCmd = lifeos.command('strategies').description('Inspect self-learned recovery strategies and site tactics');

  const stratListCmd = addOutputFormatOption(
    stratCmd.command('list').description('List all learned recovery strategies')
  );
  stratListCmd.action(async (opts: any, command: Command) => {
    const adapter = new LearningAdapter();
    const list = adapter.loadFromLocalCache();
    const fmt = resolveCommandOutputFormat(command, opts.format);
    if (fmt === null) return;
    if (outputFormatIsExplicit(command)) {
      await renderOutput(list, { fmt, fmtExplicit: true });
    } else {
      console.log(`Learned Recovery Strategies (${list.length}):\n`);
      if (list.length === 0) {
        console.log('No recovery strategies learned yet. Run "webcmd lifeos apply" on an application to build memory.');
        return;
      }
      for (const item of list) {
        console.log(`  • [${item.domain}] ${item.classification}: ${item.description}`);
        console.log(`    Action: ${item.recoveryAction} | Trigger: ${item.triggerPattern}`);
      }
    }
  });

  stratCmd
    .command('clear')
    .description('Clear all learned recovery strategies from local memory')
    .action(() => {
      const adapter = new LearningAdapter();
      adapter.clearLocalCache();
      console.log('✅ Cleared all learned recovery strategies from local memory.');
    });

  // ── 4. Action Logs ──────────────────────────────────────────────────────────
  const logsCmd = lifeos.command('logs').description('Inspect execution audit logs and recovery timelines');

  logsCmd
    .command('list')
    .description('List recent execution logs')
    .action(() => {
      const list = ActionLogger.listLogs();
      if (list.length === 0) {
        console.log('No action logs recorded yet.');
        return;
      }
      console.log(`Recent LifeOS Runs (${list.length}):\n`);
      for (const log of list.slice(0, 10)) {
        console.log(`  • ${log.runId} (${log.date})`);
        console.log(`    Path: ${log.path}`);
      }
    });

  logsCmd
    .command('show <runId>')
    .description('Show details of an execution log')
    .action((runId: string) => {
      const log = ActionLogger.readLog(runId);
      if (!log) {
        console.error(`Log not found: ${runId}`);
        process.exitCode = 1;
        return;
      }
      console.log(JSON.stringify(log, null, 2));
    });

  return lifeos;
}
