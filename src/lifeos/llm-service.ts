/**
 * OpenRouter LLM Service for Apply Anywhere - LifeOS Agent.
 *
 * Powers:
 * - Semantic UI Failure Diagnosis and Dynamic Remedy Synthesis
 * - Intelligent Screening Question Answering and Contextual Form Field Resolution
 * - Natural Language Goal Understanding and Stepper Change Perception
 *
 * Default Model: nvidia/nemotron-3-ultra-550b-a55b:free
 * Endpoint: https://openrouter.ai/api/v1/chat/completions
 */

import './env.js';
import type {
  ApplicantProfile,
  FailureClassification,
  RecoveryTactic,
  UIChangeReport,
} from './types.js';

export const DEFAULT_OPENROUTER_MODEL = 'nvidia/nemotron-3-ultra-550b-a55b:free';
export const DEFAULT_OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';

export interface OpenRouterLlmServiceOptions {
  apiKey?: string;
  model?: string;
  baseUrl?: string;
  timeoutMs?: number;
  fetchImpl?: typeof fetch;
}

export interface LlmRecoveryRequest {
  domain: string;
  classification: FailureClassification;
  failedSelector?: string;
  uiChange?: UIChangeReport;
  errorMessage?: string;
  triggerContext?: string;
  htmlSnippet?: string;
  profile?: ApplicantProfile;
}

export interface LlmFieldResolutionRequest {
  labelOrName: string;
  type?: string;
  placeholder?: string;
  options?: string[];
  isRequired?: boolean;
  profile: ApplicantProfile;
}

export class OpenRouterLlmService {
  private readonly apiKey?: string;
  private readonly model: string;
  private readonly baseUrl: string;
  private readonly timeoutMs: number;
  private readonly fetchImpl: typeof fetch;

  constructor(opts?: OpenRouterLlmServiceOptions) {
    this.apiKey = opts?.apiKey ?? process.env.OPENROUTER_API_KEY;
    this.model = opts?.model ?? process.env.OPENROUTER_MODEL ?? DEFAULT_OPENROUTER_MODEL;
    this.baseUrl = (
      opts?.baseUrl ??
      process.env.OPENROUTER_BASE_URL ??
      DEFAULT_OPENROUTER_BASE_URL
    ).replace(/\/+$/, '');
    this.timeoutMs =
      opts?.timeoutMs ??
      (process.env.OPENROUTER_TIMEOUT_MS ? Number(process.env.OPENROUTER_TIMEOUT_MS) : 30000);
    this.fetchImpl = opts?.fetchImpl ?? fetch;
  }

  isConfigured(): boolean {
    if (!this.apiKey || this.apiKey.trim().length === 0) {
      return false;
    }
    // Prevent unmocked live network calls during unit test suites
    if (
      process.env.NODE_ENV === 'test' &&
      this.fetchImpl === fetch &&
      process.env.OPENROUTER_ENABLE_LIVE_TEST !== '1'
    ) {
      return false;
    }
    return true;
  }

  getModel(): string {
    return this.model;
  }

  getBaseUrl(): string {
    return this.baseUrl;
  }

  /**
   * Performs a fast connectivity and health verification against OpenRouter.
   */
  async testConnection(): Promise<{
    ok: boolean;
    model: string;
    message?: string;
    latencyMs?: number;
    error?: string;
  }> {
    if (!this.isConfigured()) {
      return {
        ok: false,
        model: this.model,
        error: 'OPENROUTER_API_KEY is not configured in .env.local or environment.',
      };
    }

    const start = Date.now();
    try {
      const response = await this.chatCompletion([
        {
          role: 'system',
          content: 'You are the LifeOS autonomous browser agent reasoner.',
        },
        {
          role: 'user',
          content: 'Respond with exactly the text "ONLINE" to confirm connectivity.',
        },
      ]);

      const latencyMs = Date.now() - start;
      if (response) {
        return {
          ok: true,
          model: this.model,
          message: response.trim(),
          latencyMs,
        };
      }
      return {
        ok: false,
        model: this.model,
        error: 'Empty response received from OpenRouter.',
        latencyMs,
      };
    } catch (err: any) {
      return {
        ok: false,
        model: this.model,
        error: err instanceof Error ? err.message : String(err),
        latencyMs: Date.now() - start,
      };
    }
  }

  /**
   * Synthesizes an intelligent recovery tactic using LLM reasoning when facing
   * unfamiliar selector drift, blocking overlays, or custom ATS structures.
   */
  async synthesizeRecoveryTactic(req: LlmRecoveryRequest): Promise<RecoveryTactic | null> {
    if (!this.isConfigured()) {
      return null;
    }

    const systemPrompt = `You are the autonomous reasoning engine of LifeOS (Webcmd), a browser agent designed to complete job applications and recover from unexpected UI drift.
Your task is to diagnose a web UI failure and return a precise JSON recovery strategy.

Allowed recovery actions:
- DISMISS_MODAL (e.g. click cookie consent buttons, close overlay dialogs, press Escape)
- RETRY_WITH_FALLBACK_SELECTOR (use alternative CSS selector matching new/drifted labels)
- CORRECT_INPUT_FORMAT (reformat input or fill missed required field)
- DISPATCH_FILE_INPUT (trigger hidden file upload dropzone)
- SCROLL_AND_RETRY (scroll element into view and retry click)
- WAIT_AND_RETRY (wait for dynamic elements to render)

Output ONLY valid raw JSON with this exact structure (no Markdown backticks, no markdown fence):
{
  "description": "Clear human-readable description of the recovery tactic",
  "recoveryAction": "DISMISS_MODAL" | "RETRY_WITH_FALLBACK_SELECTOR" | "CORRECT_INPUT_FORMAT" | "DISPATCH_FILE_INPUT" | "SCROLL_AND_RETRY" | "WAIT_AND_RETRY",
  "fallbackSelector": "CSS selector to use if applicable",
  "alternativeSelectors": ["array", "of", "candidate", "CSS", "selectors"],
  "remedyCode": "safe JavaScript expression or IIFE to execute in browser DOM context",
  "confidence": 0.85
}`;

    const userPrompt = `Target Domain: ${req.domain}
Failure Classification: ${req.classification}
Failed Selector: ${req.failedSelector || 'None specified'}
Error Context: ${req.errorMessage || req.triggerContext || 'Element interaction prevented or not found'}
UI Changes Observed: ${req.uiChange ? JSON.stringify(req.uiChange) : 'None'}
HTML Snippet: ${req.htmlSnippet ? req.htmlSnippet.slice(0, 800) : 'Not provided'}

Synthesize the optimal recovery tactic now.`;

    try {
      const reply = await this.chatCompletion(
        [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        { json: true, temperature: 0.1 }
      );

      if (!reply) return null;

      const parsed = this.parseJsonSafely(reply);
      if (!parsed || !parsed.recoveryAction) return null;

      const validAction = this.sanitizeRecoveryAction(parsed.recoveryAction);
      if (!validAction) return null;

      const tactic: RecoveryTactic = {
        strategyId: `openrouter-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        domain: req.domain,
        classification: req.classification,
        triggerPattern: req.failedSelector || req.errorMessage || req.classification,
        description: parsed.description || `AI-synthesized recovery for ${req.classification}`,
        recoveryAction: validAction,
        fallbackSelector: parsed.fallbackSelector,
        alternativeSelectors: Array.isArray(parsed.alternativeSelectors)
          ? parsed.alternativeSelectors
          : undefined,
        remedyCode: parsed.remedyCode,
        confidence: Math.min(Math.max(Number(parsed.confidence) || 0.85, 0.5), 0.99),
        isLearned: true,
        source: 'openrouter_llm',
        originDetails: `AI-synthesized via OpenRouter (${this.model})`,
      };

      return tactic;
    } catch {
      return null;
    }
  }

  /**
   * Intelligently resolves the appropriate value for an ambiguous form field
   * or custom ATS screening question from the candidate's profile.
   */
  async resolveFieldWithLlm(
    req: LlmFieldResolutionRequest
  ): Promise<{ key: string; value: string; confidence: number } | null> {
    if (!this.isConfigured()) {
      return null;
    }

    const systemPrompt = `You are the candidate profile matching engine for LifeOS job applications.
Given a form input label/name and the candidate's profile, determine the exact value to populate in this input.
For screening questions (e.g. "Why do you want to join?", "Are you authorized to work in the US?", "Years of experience?", "Skills"), answer accurately and professionally based on the profile.

Return ONLY raw JSON in this format:
{
  "key": "matched_attribute_or_question",
  "value": "Exact string to input",
  "confidence": 0.95
}`;

    const profileSummary = {
      fullName: req.profile.fullName,
      email: req.profile.email,
      phone: req.profile.phone,
      location: req.profile.location,
      currentCompany: req.profile.currentCompany,
      currentTitle: req.profile.currentTitle,
      yearsExperience: req.profile.yearsExperience,
      skills: req.profile.skills,
      education: req.profile.education,
      experience: req.profile.experience,
      answers: req.profile.answers,
      coverLetter: req.profile.coverLetter,
      links: {
        github: req.profile.githubUrl,
        linkedin: req.profile.linkedinUrl,
        portfolio: req.profile.portfolioUrl,
      },
    };

    const userPrompt = `Form Input Label / Name: "${req.labelOrName}"
Input Type: ${req.type || 'text'}
Placeholder: ${req.placeholder || 'none'}
Options (if select/radio): ${req.options ? req.options.join(', ') : 'none'}
Required: ${Boolean(req.isRequired)}

Candidate Profile:
${JSON.stringify(profileSummary, null, 2)}

Resolve the value to enter into this field.`;

    try {
      const reply = await this.chatCompletion(
        [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        { json: true, temperature: 0.1 }
      );

      if (!reply) return null;

      const parsed = this.parseJsonSafely(reply);
      if (!parsed || parsed.value === undefined || parsed.value === null) return null;

      return {
        key: String(parsed.key || req.labelOrName),
        value: String(parsed.value),
        confidence: Math.min(Math.max(Number(parsed.confidence) || 0.85, 0.1), 1.0),
      };
    } catch {
      return null;
    }
  }

  /**
   * Core chat completion dispatch to OpenRouter REST API.
   */
  async chatCompletion(
    messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
    options?: { json?: boolean; temperature?: number }
  ): Promise<string | null> {
    if (!this.isConfigured()) {
      return null;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const url = `${this.baseUrl}/chat/completions`;
      const body: Record<string, unknown> = {
        model: this.model,
        messages,
        temperature: options?.temperature ?? 0.2,
      };

      if (options?.json) {
        body.response_format = { type: 'json_object' };
      }

      const response = await this.fetchImpl(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://github.com/agentrhq/webcmd',
          'X-Title': 'Webcmd LifeOS Agent',
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      if (!response.ok) {
        // Redact authorization tokens in logs
        return null;
      }

      const data = (await response.json()) as any;
      const message = data?.choices?.[0]?.message;
      let content = message?.content;
      if (!content && message?.reasoning) {
        content = message.reasoning;
      }
      return typeof content === 'string' && content.trim().length > 0 ? content : null;
    } catch {
      return null;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  private parseJsonSafely(text: string): Record<string, any> | null {
    try {
      return JSON.parse(text);
    } catch {
      // Clean up potential markdown formatting (```json ... ```)
      const clean = text
        .replace(/^```(?:json)?\s*/i, '')
        .replace(/\s*```$/i, '')
        .trim();
      try {
        return JSON.parse(clean);
      } catch {
        const match = clean.match(/\{[\s\S]*\}/);
        if (match) {
          try {
            return JSON.parse(match[0]);
          } catch {}
        }
        return null;
      }
    }
  }

  private sanitizeRecoveryAction(action: string): RecoveryTactic['recoveryAction'] | null {
    const valid: RecoveryTactic['recoveryAction'][] = [
      'DISMISS_MODAL',
      'RETRY_WITH_FALLBACK_SELECTOR',
      'CORRECT_INPUT_FORMAT',
      'DISPATCH_FILE_INPUT',
      'SCROLL_AND_RETRY',
      'WAIT_AND_RETRY',
    ];
    const upper = action.toUpperCase() as RecoveryTactic['recoveryAction'];
    return valid.includes(upper) ? upper : null;
  }
}
