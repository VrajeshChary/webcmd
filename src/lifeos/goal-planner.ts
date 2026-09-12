import type { AtsPlatform, GoalIntent, WorkflowPhase } from './types.js';

export interface PlannedStep {
  phase: WorkflowPhase;
  name: string;
  description: string;
}

export class GoalPlanner {
  /**
   * Parses natural language goal into structured intent.
   */
  static parseGoal(input: string, defaultUrl?: string): GoalIntent {
    const rawGoal = input.trim();

    // 1. Extract URL if present
    const urlMatch = rawGoal.match(/https?:\/\/[^\s"',]+/i);
    const targetUrl = urlMatch ? urlMatch[0] : (defaultUrl || '');

    // 2. Identify ATS platform
    const atsType = GoalPlanner.detectAts(targetUrl);

    // 3. Extract Role / Job Title
    let targetRole: string | undefined;
    const roleMatch = rawGoal.match(/(?:apply\s+(?:to|for)\s+(?:the\s+)?)([^,\.\n]+?)(?:\s+(?:position|role|job|at|on|with)|$)/i);
    if (roleMatch && roleMatch[1]) {
      targetRole = roleMatch[1].trim();
    }

    // 4. Extract Company
    let company: string | undefined;
    const companyMatch = rawGoal.match(/(?:at|for|on)\s+([A-Z][A-Za-z0-9_\-\.\s]+?)(?:\s+(?:with|using|and|\.|$))/);
    if (companyMatch && companyMatch[1] && !companyMatch[1].toLowerCase().includes('greenhouse') && !companyMatch[1].toLowerCase().includes('lever')) {
      company = companyMatch[1].trim();
    }

    const autoSubmit = /auto[- ]?submit|submit\s+directly|finish\s+completely/i.test(rawGoal);
    const dryRun = /dry[- ]?run|preview\s+only|do\s+not\s+submit|fill\s+only/i.test(rawGoal);

    return {
      rawGoal,
      targetUrl,
      targetRole,
      company,
      atsType,
      autoSubmit: autoSubmit && !dryRun,
      dryRun,
    };
  }

  static detectAts(url: string): AtsPlatform {
    const u = url.toLowerCase();
    if (u.includes('greenhouse.io')) return 'greenhouse';
    if (u.includes('lever.co')) return 'lever';
    if (u.includes('workday.com') || u.includes('myworkdayjobs.com')) return 'workday';
    if (u.includes('ashbyhq.com')) return 'ashby';
    if (u.includes('smartrecruiters.com')) return 'smartrecruiters';
    return 'generic';
  }

  /**
   * Plans the workflow steps for the application.
   */
  static planWorkflow(intent: GoalIntent): PlannedStep[] {
    const steps: PlannedStep[] = [
      {
        phase: 'discovery',
        name: 'Open and inspect application portal',
        description: `Navigate to ${intent.targetUrl} and detect application form layout.`,
      },
      {
        phase: 'form_filling',
        name: 'Auto-fill applicant personal information',
        description: 'Map profile fields (name, email, phone, location, links) to inputs.',
      },
      {
        phase: 'file_upload',
        name: 'Attach resume and documents',
        description: 'Locate file inputs or dropzones and attach candidate resume.',
      },
      {
        phase: 'review',
        name: 'Review required fields and consent',
        description: 'Verify all required fields are satisfied and answer standard disclosures.',
      },
    ];

    if (intent.autoSubmit && !intent.dryRun) {
      steps.push({
        phase: 'submission',
        name: 'Submit completed application',
        description: 'Click final submit button and confirm receipt.',
      });
    } else {
      steps.push({
        phase: 'review',
        name: 'Application prepared for final review',
        description: 'Form filled completely; left unsubmitted for user verification.',
      });
    }

    return steps;
  }
}
