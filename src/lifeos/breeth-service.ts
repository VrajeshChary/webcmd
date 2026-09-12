/**
 * Breeth Memory Service Client for LifeOS.
 *
 * System Architecture & Separation of Concerns:
 * - Webcmd: Deterministic browser execution, DOM perception, action dispatch, and local run auditing.
 * - Local Learning Cache (strategies.json): Fast, zero-latency offline fallback for known tactics.
 * - Breeth: Semantic long-term recovery memory, cross-domain pattern matching, and reasoning layer.
 *
 * Official Breeth REST API:
 * - Base URL: https://api.thebreeth.com/v1 (override via BREETH_BASE_URL or BREETH_API_URL)
 * - Endpoints:
 *   - POST /v1/episodes (record episodic recovery events)
 *   - POST /v1/facts    (persist learned domain/ATS facts)
 *   - POST /v1/search   (semantic search across memories)
 * - Authentication:
 *   - Authorization: Bearer <BREETH_API_KEY>
 *
 * Resilience Principles:
 * - Missing API keys or network/API failures fail gracefully without crashing the browser agent.
 * - API secrets and authorization tokens are strictly guarded and never emitted to console/logs.
 * - Native fetch is used exclusively with no external HTTP dependencies.
 */

import './env.js';
import type {
  AtsPlatform,
  BreethQueryPayload,
  BreethQueryResult,
  BreethRecoveryRecord,
} from './types.js';

export interface BreethServiceOptions {
  apiKey?: string;
  baseUrl?: string;
  timeoutMs?: number;
  /** Custom endpoint paths if connecting through an API proxy or custom gateway */
  endpoints?: {
    episodes?: string;
    facts?: string;
    search?: string;
    /** Alias for episodes */
    saveStrategy?: string;
    /** Alias for search */
    queryStrategies?: string;
  };
}

/**
 * Official Breeth Memory REST API endpoints.
 */
export const DEFAULT_BREETH_BASE_URL = 'https://api.thebreeth.com/v1';
export const DEFAULT_BREETH_ENDPOINTS = {
  episodes: '/episodes',
  facts: '/facts',
  search: '/search',
} as const;

export class BreethService {
  private readonly apiKey?: string;
  private readonly baseUrl: string;
  private readonly timeoutMs: number;
  private readonly endpoints: {
    episodes: string;
    facts: string;
    search: string;
  };

  constructor(opts?: BreethServiceOptions) {
    this.apiKey = opts?.apiKey ?? process.env.BREETH_API_KEY;

    let base = (
      opts?.baseUrl ??
      process.env.BREETH_BASE_URL ??
      process.env.BREETH_API_URL ??
      DEFAULT_BREETH_BASE_URL
    ).replace(/\/+$/, '');

    // Ensure /v1 version suffix if base is https://api.thebreeth.com without version
    if (!base.endsWith('/v1') && !base.includes('/v1/')) {
      base = `${base}/v1`;
    }
    this.baseUrl = base;

    this.timeoutMs = opts?.timeoutMs ?? 8000;
    this.endpoints = {
      episodes: opts?.endpoints?.episodes ?? opts?.endpoints?.saveStrategy ?? DEFAULT_BREETH_ENDPOINTS.episodes,
      facts: opts?.endpoints?.facts ?? DEFAULT_BREETH_ENDPOINTS.facts,
      search: opts?.endpoints?.search ?? opts?.endpoints?.queryStrategies ?? DEFAULT_BREETH_ENDPOINTS.search,
    };
  }

  /**
   * Returns the resolved base URL.
   */
  getBaseUrl(): string {
    return this.baseUrl;
  }

  /**
   * Returns true if Breeth credentials are configured in the environment.
   */
  isConfigured(): boolean {
    return Boolean(this.apiKey && this.apiKey.trim().length > 0);
  }

  /**
   * Persists a learned recovery strategy episode into Breeth's episodic memory layer
   * via POST /v1/episodes.
   *
   * @param record The recovery episode and remedy details.
   * @returns Promise<boolean> indicating whether the memory was successfully persisted.
   */
  async saveRecoveryStrategy(record: BreethRecoveryRecord): Promise<boolean> {
    if (!this.isConfigured()) {
      return false;
    }

    try {
      const url = `${this.baseUrl}${this.endpoints.episodes}`;
      const payload = {
        content: `[Recovery: ${record.classification}] ${record.lessonLearned || record.symptom}. Action: ${record.recoveryAction} on ${record.domain}`,
        domain: record.domain,
        atsType: record.atsType,
        classification: record.classification,
        symptom: record.symptom,
        failedSelector: record.failedSelector,
        recoveryAction: record.recoveryAction,
        remedy: record.remedy,
        fallbackSelector: record.fallbackSelector,
        alternativeSelectors: record.alternativeSelectors,
        outcome: record.outcome,
        confidence: record.confidence,
        lessonLearned: record.lessonLearned,
        metadata: {
          ...record.metadata,
          savedAt: new Date().toISOString(),
          source: 'webcmd-lifeos-agent',
          domain: record.domain,
          atsType: record.atsType,
          classification: record.classification,
          recoveryAction: record.recoveryAction,
          remedy: record.remedy,
        },
      };

      const response = await this.safeFetch(url, {
        method: 'POST',
        headers: this.buildHeaders(),
        body: JSON.stringify(payload),
      });

      if (!response) {
        return false;
      }

      if (!response.ok) {
        this.logSafeWarning(
          `Failed to persist recovery episode (HTTP ${response.status}: ${response.statusText})`
        );
        return false;
      }

      return true;
    } catch (err) {
      this.logSafeError('Unexpected error during saveRecoveryStrategy', err);
      return false;
    }
  }

  /**
   * Persists a standalone learned fact into Breeth's semantic facts layer
   * via POST /v1/facts.
   *
   * @param fact Factual statement learned (e.g. "Workday forms on domain X hide file inputs in shadow DOM")
   * @param metadata Optional metadata tags
   * @returns Promise<boolean>
   */
  async saveFact(fact: string, metadata?: Record<string, unknown>): Promise<boolean> {
    if (!this.isConfigured()) {
      return false;
    }

    try {
      const url = `${this.baseUrl}${this.endpoints.facts}`;
      const payload = {
        fact,
        metadata: {
          ...metadata,
          savedAt: new Date().toISOString(),
          source: 'webcmd-lifeos-agent',
        },
      };

      const response = await this.safeFetch(url, {
        method: 'POST',
        headers: this.buildHeaders(),
        body: JSON.stringify(payload),
      });

      if (!response) {
        return false;
      }

      if (!response.ok) {
        this.logSafeWarning(
          `Failed to persist fact (HTTP ${response.status}: ${response.statusText})`
        );
        return false;
      }

      return true;
    } catch (err) {
      this.logSafeError('Unexpected error during saveFact', err);
      return false;
    }
  }

  /**
   * Queries Breeth semantic memory for learned recovery strategies matching
   * a specific failure symptom, domain, or ATS platform via POST /v1/search.
   *
   * @param query Search parameters including domain, classification, symptom, and ATS type.
   * @returns List of matching BreethQueryResult candidates, or empty array if unavailable.
   */
  async queryRecoveryStrategies(query: BreethQueryPayload): Promise<BreethQueryResult[]> {
    if (!this.isConfigured()) {
      return [];
    }

    try {
      const url = `${this.baseUrl}${this.endpoints.search}`;
      const queryText = [
        query.domain,
        query.atsType,
        query.classification,
        query.symptom,
        query.failedSelector,
        query.isPreemptive ? 'preemptive modal banner dismiss' : '',
      ]
        .filter(Boolean)
        .join(' ');

      const response = await this.safeFetch(url, {
        method: 'POST',
        headers: this.buildHeaders(),
        body: JSON.stringify({
          query: queryText,
          domain: query.domain,
          atsType: query.atsType,
          classification: query.classification,
          symptom: query.symptom,
          failedSelector: query.failedSelector,
          isPreemptive: Boolean(query.isPreemptive),
          limit: query.limit ?? 5,
          filter: {
            domain: query.domain,
            ...(query.atsType ? { atsType: query.atsType } : {}),
            ...(query.classification ? { classification: query.classification } : {}),
          },
        }),
      });

      if (!response) {
        return [];
      }

      if (!response.ok) {
        this.logSafeWarning(
          `Failed to query recovery strategies (HTTP ${response.status}: ${response.statusText})`
        );
        return [];
      }

      const body = await response.json();
      return this.validateAndParseQueryResults(body, query.domain);
    } catch (err) {
      this.logSafeError('Unexpected error during queryRecoveryStrategies', err);
      return [];
    }
  }

  /**
   * Pre-emptively queries Breeth for known site obstacles (e.g. cookie consent dialogs,
   * overlay banners) before interacting with form fields.
   *
   * @param domain Application portal domain.
   * @param atsType ATS platform if identified.
   * @returns Pre-emptive strategy candidates.
   */
  async queryPreemptiveStrategies(
    domain: string,
    atsType?: AtsPlatform | string
  ): Promise<BreethQueryResult[]> {
    return this.queryRecoveryStrategies({
      domain,
      atsType,
      isPreemptive: true,
      classification: 'MODAL_BLOCKER',
      limit: 3,
    });
  }

  /**
   * Safe native fetch wrapper with timeout and error containment.
   * Never throws; returns null on error.
   */
  private async safeFetch(url: string, init: RequestInit): Promise<Response | null> {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), this.timeoutMs);

      const response = await fetch(url, {
        ...init,
        signal: controller.signal,
      });

      clearTimeout(timer);
      return response;
    } catch (err: any) {
      if (err?.name === 'AbortError') {
        this.logSafeWarning(`Breeth request timed out after ${this.timeoutMs}ms`);
      } else {
        this.logSafeWarning(`Breeth network request failed: ${err instanceof Error ? err.message : String(err)}`);
      }
      return null;
    }
  }

  /**
   * Constructs request headers without leaking secrets.
   */
  private buildHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'User-Agent': 'webcmd-lifeos/0.8.4',
    };

    if (this.apiKey) {
      headers.Authorization = `Bearer ${this.apiKey}`;
    }

    return headers;
  }

  /**
   * Validates and parses raw API responses into well-typed BreethQueryResult items.
   */
  private validateAndParseQueryResults(raw: unknown, fallbackDomain: string): BreethQueryResult[] {
    if (!raw || typeof raw !== 'object') {
      return [];
    }

    // Handles responses structured as either { results: [...] }, { memories: [...] }, { episodes: [...] }, or a raw array [...]
    const rawList = Array.isArray(raw)
      ? raw
      : Array.isArray((raw as any).results)
      ? (raw as any).results
      : Array.isArray((raw as any).memories)
      ? (raw as any).memories
      : Array.isArray((raw as any).episodes)
      ? (raw as any).episodes
      : Array.isArray((raw as any).data)
      ? (raw as any).data
      : [];

    const results: BreethQueryResult[] = [];

    for (const item of rawList) {
      if (!item || typeof item !== 'object') continue;

      const meta = (item.metadata && typeof item.metadata === 'object') ? item.metadata : {};
      const strategyId = String(
        item.strategyId || item.id || item.episode_id || `breeth-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
      );
      const domain = String(item.domain || meta.domain || fallbackDomain);
      const classification = item.classification || meta.classification || 'SELECTOR_DRIFT';
      const triggerPattern = String(item.triggerPattern || item.symptom || item.trigger || meta.symptom || '');
      const description = String(
        item.description || item.lessonLearned || item.content || item.fact || meta.lessonLearned || 'Learned recovery tactic from Breeth memory'
      );
      const recoveryAction = item.recoveryAction || meta.recoveryAction || item.action || 'RETRY_WITH_FALLBACK_SELECTOR';
      const remedyCode = typeof item.remedyCode === 'string'
        ? item.remedyCode
        : typeof item.remedy === 'string'
        ? item.remedy
        : typeof meta.remedyCode === 'string'
        ? meta.remedyCode
        : typeof meta.remedy === 'string'
        ? meta.remedy
        : undefined;

      const fallbackSelector = item.fallbackSelector ? String(item.fallbackSelector) : (meta.fallbackSelector ? String(meta.fallbackSelector) : undefined);
      const alternativeSelectors = Array.isArray(item.alternativeSelectors)
        ? item.alternativeSelectors.map(String)
        : Array.isArray(meta.alternativeSelectors)
        ? meta.alternativeSelectors.map(String)
        : undefined;
      const confidence = typeof item.confidence === 'number'
        ? item.confidence
        : typeof meta.confidence === 'number'
        ? meta.confidence
        : 0.8;
      const relevanceScore = typeof item.relevanceScore === 'number'
        ? item.relevanceScore
        : typeof item.score === 'number'
        ? item.score
        : typeof item.similarity === 'number'
        ? item.similarity
        : undefined;

      results.push({
        strategyId,
        domain,
        atsType: item.atsType ? String(item.atsType) : (meta.atsType ? String(meta.atsType) : undefined),
        classification,
        triggerPattern,
        description,
        recoveryAction,
        remedyCode,
        fallbackSelector,
        alternativeSelectors,
        confidence,
        relevanceScore,
        createdAt: item.createdAt || item.timestamp || meta.savedAt,
      });
    }

    return results;
  }

  /**
   * Safe warning logging that prevents secret leaks.
   */
  private logSafeWarning(message: string): void {
    const sanitized = this.apiKey ? message.replaceAll(this.apiKey, '[REDACTED]') : message;
    console.warn(`[BreethService] ⚠️ ${sanitized}`);
  }

  /**
   * Safe error logging that prevents secret leaks.
   */
  private logSafeError(context: string, err: unknown): void {
    const errorMsg = err instanceof Error ? err.message : String(err);
    const sanitized = this.apiKey ? errorMsg.replaceAll(this.apiKey, '[REDACTED]') : errorMsg;
    console.warn(`[BreethService] ⚠️ ${context}: ${sanitized}`);
  }
}
