import { HttpException, Injectable } from '@nestjs/common';
import { AppLogger } from '../common/logger/app-logger.service';

export interface PromptSafetyResult {
  cleaned: string;
  flagged: boolean;
  reasons: string[];
}

const MAX_LENGTH = 4000;

const BLOCK_PATTERNS: Array<{ name: string; re: RegExp }> = [
  {
    name: 'IGNORE_PRIOR',
    re: /\b(ignore|disregard|forget)\b.*\b(previous|above|earlier|prior|all)\b.*(instruction|prompt|rule|message)/i,
  },
  {
    name: 'ROLE_SWITCH',
    re: /\b(you are now|from now on you are|act as|pretend to be|roleplay as|new role|new persona)\b/i,
  },
  {
    name: 'JAILBREAK',
    re: /\b(DAN|jailbreak|developer mode|sudo mode|unrestricted mode)\b/i,
  },
  {
    name: 'EXFIL_PROMPT',
    re: /\b(show|reveal|print|repeat|what (is|are) your)\b.*\b(system prompt|instructions|rules|initial prompt|hidden prompt)\b/i,
  },
  {
    name: 'DELIMITER_SPOOF',
    re: /<<<\/?(USER_MESSAGE|END_USER_MESSAGE|SYSTEM)>>>/i,
  },
];

const SOFT_PATTERNS: Array<{ name: string; re: RegExp }> = [
  { name: 'SYSTEM_TAG', re: /(^|\s)(system|assistant|developer)\s*:/i },
  { name: 'TOOL_INJECTION', re: /\b(call|invoke|execute)\b.*\b(tool|function|api)\b/i },
  { name: 'MASS_CONTROL', re: /[\u0000-\u001F]{5,}/ },
];

@Injectable()
export class PromptSafetyService {
  constructor(private readonly logger: AppLogger) {
    this.logger.setContext('PromptSafetyService');
  }

  check(raw: string, meta: { userId: string }): PromptSafetyResult {
    if (raw.length > MAX_LENGTH) {
      throw new HttpException('Message too long', 400);
    }

    // Normalize: strip control chars and collapse long whitespace runs
    let cleaned = raw.replace(/[\u0000-\u0008\u000B-\u001F\u007F]/g, ' ');
    cleaned = cleaned.replace(/\s{20,}/g, ' ');

    // Neutralize delimiter collisions
    cleaned = cleaned.replace(/<<<USER_MESSAGE>>>/gi, '[delim]');
    cleaned = cleaned.replace(/<<<END_USER_MESSAGE>>>/gi, '[delim]');
    cleaned = cleaned.replace(/ \|\|\| /g, ' [sep] ');

    // Check block patterns on the ORIGINAL text (before sanitization neutralises it)
    const blockReasons: string[] = [];
    for (const { name, re } of BLOCK_PATTERNS) {
      if (re.test(raw)) blockReasons.push(name);
    }

    if (blockReasons.length > 0) {
      this.logger.warn('prompt_injection_blocked', {
        userId: meta.userId,
        reasons: blockReasons,
        sample: raw.slice(0, 120),
      });
      throw new HttpException('Message cannot be processed', 400);
    }

    // Check soft patterns — sanitize and pass through
    const softReasons: string[] = [];
    for (const { name, re } of SOFT_PATTERNS) {
      if (re.test(raw)) softReasons.push(name);
    }

    if (softReasons.length > 0) {
      this.logger.warn('prompt_injection_flagged', {
        userId: meta.userId,
        reasons: softReasons,
        sample: raw.slice(0, 120),
      });
      return { cleaned, flagged: true, reasons: softReasons };
    }

    return { cleaned, flagged: false, reasons: [] };
  }
}
