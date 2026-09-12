import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import type { ApplicantProfile } from './types.js';

export const LIFEOS_DIR = path.join(os.homedir(), '.webcmd', 'lifeos');
export const DEFAULT_PROFILE_PATH = path.join(LIFEOS_DIR, 'profile.json');

export const SAMPLE_PROFILE: ApplicantProfile = {
  fullName: 'Alex Morgan',
  firstName: 'Alex',
  lastName: 'Morgan',
  email: 'alex.morgan@example.com',
  phone: '+1 (555) 234-5678',
  location: 'San Francisco, CA',
  linkedinUrl: 'https://linkedin.com/in/alexmorgan-dev',
  githubUrl: 'https://github.com/alexmorgan',
  portfolioUrl: 'https://alexmorgan.dev',
  currentCompany: 'Apex Software',
  currentTitle: 'Senior Software Engineer',
  yearsExperience: 6,
  education: [
    {
      school: 'University of California, Berkeley',
      degree: 'B.S.',
      field: 'Computer Science',
      graduationYear: 2020,
    },
  ],
  experience: [
    {
      company: 'Apex Software',
      title: 'Senior Software Engineer',
      startDate: '2022-03',
      isCurrent: true,
      summary: 'Architected distributed event pipelines and browser automation services.',
    },
    {
      company: 'DataStream Inc.',
      title: 'Software Engineer',
      startDate: '2020-06',
      endDate: '2022-02',
      summary: 'Developed fullstack TypeScript web applications and REST APIs.',
    },
  ],
  skills: ['TypeScript', 'JavaScript', 'Node.js', 'React', 'Python', 'Playwright', 'Docker'],
  resumePath: '',
  coverLetter: 'I am excited to apply for this role. With my background in high-scale systems and frontend excellence, I look forward to delivering immediate value.',
  answers: {
    authorized_to_work: true,
    require_sponsorship: false,
    notice_period: '2 weeks',
    gender: 'Decline to self-identify',
    veteran_status: 'I am not a protected veteran',
    disability_status: 'No, I do not have a disability',
  },
};

export class ProfileStore {
  private profilePath: string;

  constructor(customPath?: string) {
    this.profilePath = customPath || DEFAULT_PROFILE_PATH;
  }

  getProfilePath(): string {
    return this.profilePath;
  }

  ensureDir(): void {
    const dir = path.dirname(this.profilePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  exists(): boolean {
    return fs.existsSync(this.profilePath);
  }

  load(): ApplicantProfile {
    if (!this.exists()) {
      return this.initDefault();
    }
    try {
      const raw = fs.readFileSync(this.profilePath, 'utf-8');
      const parsed = JSON.parse(raw) as Partial<ApplicantProfile>;
      return {
        ...SAMPLE_PROFILE,
        ...parsed,
        answers: {
          ...SAMPLE_PROFILE.answers,
          ...(parsed.answers || {}),
        },
      };
    } catch {
      return SAMPLE_PROFILE;
    }
  }

  save(profile: ApplicantProfile): void {
    this.ensureDir();
    fs.writeFileSync(this.profilePath, JSON.stringify(profile, null, 2), 'utf-8');
  }

  initDefault(): ApplicantProfile {
    this.ensureDir();
    this.save(SAMPLE_PROFILE);
    return SAMPLE_PROFILE;
  }

  validate(profile: Partial<ApplicantProfile>): { valid: boolean; missingFields: string[] } {
    const requiredKeys: (keyof ApplicantProfile)[] = ['fullName', 'email', 'phone'];
    const missing = requiredKeys.filter((key) => {
      const val = profile[key];
      return typeof val !== 'string' || val.trim().length === 0;
    });
    return {
      valid: missing.length === 0,
      missingFields: missing.map(String),
    };
  }

  /**
   * Matches semantic form field cues to values from the applicant profile.
   */
  resolveFieldValue(labelOrName: string, profile: ApplicantProfile): { key: string; value: string } | null {
    const normalized = labelOrName.toLowerCase().replace(/[^a-z0-9]/g, ' ').trim();

    if (/\b(first\s*name|given\s*name|fname)\b/.test(normalized)) {
      return { key: 'firstName', value: profile.firstName || profile.fullName.split(' ')[0] || '' };
    }
    if (/\b(last\s*name|surname|family\s*name|lname)\b/.test(normalized)) {
      const parts = profile.fullName.split(' ');
      return { key: 'lastName', value: profile.lastName || (parts.length > 1 ? parts.slice(1).join(' ') : '') };
    }
    if (/\b(full\s*name|your\s*name|candidate\s*name)\b/.test(normalized)) {
      return { key: 'fullName', value: profile.fullName };
    }
    if (/\b(email|e\s*mail)\b/.test(normalized)) {
      return { key: 'email', value: profile.email };
    }
    if (/\b(phone|telephone|mobile|cell)\b/.test(normalized)) {
      return { key: 'phone', value: profile.phone };
    }
    if (/\b(linkedin|linked\s*in)\b/.test(normalized)) {
      return { key: 'linkedinUrl', value: profile.linkedinUrl || '' };
    }
    if (/\b(github|git\s*hub)\b/.test(normalized)) {
      return { key: 'githubUrl', value: profile.githubUrl || '' };
    }
    if (/\b(portfolio|website|personal\s*link|url)\b/.test(normalized)) {
      return { key: 'portfolioUrl', value: profile.portfolioUrl || '' };
    }
    if (/\b(city|location|address|residence)\b/.test(normalized)) {
      return { key: 'location', value: profile.location };
    }
    if (/\b(current\s*company|employer|most\s*recent\s*company)\b/.test(normalized)) {
      return { key: 'currentCompany', value: profile.currentCompany || '' };
    }
    if (/\b(current\s*title|current\s*role|headline)\b/.test(normalized)) {
      return { key: 'currentTitle', value: profile.currentTitle || '' };
    }
    if (/\b(cover\s*letter|additional\s*info|notes)\b/.test(normalized)) {
      return { key: 'coverLetter', value: profile.coverLetter || '' };
    }

    // Answers mapping
    if (profile.answers) {
      for (const [ansKey, ansVal] of Object.entries(profile.answers)) {
        const cleanKey = ansKey.toLowerCase().replace(/[^a-z0-9]/g, ' ');
        if (cleanKey.split(' ').some((word) => word.length > 3 && normalized.includes(word))) {
          return { key: `answers.${ansKey}`, value: String(ansVal) };
        }
      }
    }

    return null;
  }
}
