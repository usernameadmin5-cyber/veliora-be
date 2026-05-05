import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { Model } from 'mongoose';
import { Practice } from '../practices/schemas/practice.schema';

export interface AttachmentData {
  practiceId: string;
  title: string;
  titleUk: string;
  durationMin: number;
  category: string;
  thumbnailUrl: string | null;
  videoUrl: string | null;
  gradient: string;
}

// Keyword → category mapping (checked against the user's message)
const KEYWORD_MAP: Record<string, string> = {
  'stress|anxious|anxiety|overwhelm|panic|deadline|pressure|nervous|tense':
    'Anxiety Relief',
  "sleep|tired|insomnia|rest|fatigue|exhausted|can't sleep|wake up": 'Sleep',
  'breath|breathing|meditat|calm|relax|practice|session|mindful': 'Meditation',
  'sad|lonely|hurt|disconnected|emotion|feeling|depress|cry|upset|lost':
    'Emotional health',
};

// Matches explicit requests for a wellness-specific practice, meditation, or session.
// Intentionally excludes bare "video"/"відео" — in casual chat those don't imply a
// wellness practice (e.g. "show me a funny video"), so we don't auto-attach on them.
// Split EN and UK because JS `\b` is ASCII-only — Cyrillic tokens can't use `\b`.
const REQUEST_RE_EN =
  /\b(give me (a|an|some) (practice|meditation|exercise|session)|recommend (a|an|some)? ?(practice|meditation|exercise|session)|suggest (a|an|some)? ?(practice|meditation|exercise|session)|help me (relax|calm down|sleep|breathe|meditate|unwind)|how do i (relax|calm down|sleep|breathe|meditate|unwind)|practice|meditation|breathing exercise|guided session)\b/i;
const REQUEST_RE_UK =
  /(порад(ь|и|уй).*(практик|медитац|вправ)|рекоменд.*(практик|медитац|вправ)|покажи.*(практик|медитац|вправ)|медитац|дих(а|альн)|практик|допоможи.*(розслаб|заспок|заснути|дихати|медитувати))/i;

// Emotion → category fallback — used ONLY after a wellness-specific request has
// already matched. Safe now that the request regex excludes bare "video"/"відео".
const EMOTION_CATEGORY: Record<string, string> = {
  Anxious: 'Anxiety Relief',
  Overwhelmed: 'Anxiety Relief',
  Tired: 'Sleep',
  Sad: 'Emotional health',
  Neutral: 'Meditation',
  Calm: 'Meditation',
  Motivated: 'Meditation',
};

export interface AttachmentContext {
  stressLevel?: number | null;
  emotion?: string | null;
}

@Injectable()
export class AttachmentService {
  constructor(
    @InjectModel(Practice.name) private readonly practiceModel: Model<Practice>,
  ) {}

  async detectAndFetch(
    userMessage: string,
    ctx: AttachmentContext = {},
  ): Promise<AttachmentData | null> {
    const lower = userMessage.toLowerCase();

    // Gate: only attach a practice when the user EXPLICITLY asks for help,
    // advice, or a practice/video. Venting alone is not enough.
    if (!REQUEST_RE_EN.test(lower) && !REQUEST_RE_UK.test(userMessage)) {
      return null;
    }

    // Priority 1: an explicit category keyword in the user's message (English)
    for (const [pattern, category] of Object.entries(KEYWORD_MAP)) {
      if (new RegExp(pattern).test(lower)) {
        const found = await this.pickPractice(category);
        if (found) return found;
      }
    }

    // Priority 2: fall back to the user's current mood (safe because the request
    // gate above now only lets through wellness-specific asks — a bare "show me a
    // video" no longer reaches this point, so we won't attach an out-of-context
    // practice to casual chat).
    const category = EMOTION_CATEGORY[ctx.emotion ?? ''] ?? 'Meditation';
    return this.pickPractice(category);
  }

  private async pickPractice(category: string): Promise<AttachmentData | null> {
    const [practice] = await this.practiceModel.aggregate([
      { $match: { category, active: true } },
      { $sample: { size: 1 } },
    ]);
    if (!practice) return null;
    return {
      practiceId: practice._id.toString(),
      title: practice.title,
      titleUk: practice.titleUk ?? practice.title,
      durationMin: practice.durationMin,
      category: practice.category,
      thumbnailUrl: practice.thumbnailUrl ?? null,
      videoUrl: practice.videoUrl ?? null,
      gradient: practice.gradient,
    };
  }
}
