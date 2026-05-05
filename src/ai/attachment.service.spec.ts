import { AttachmentService } from './attachment.service';

type PracticeDoc = {
  _id: { toString(): string };
  title: string;
  titleUk: string;
  durationMin: number;
  category: string;
  thumbnailUrl: string | null;
  videoUrl: string | null;
  gradient: string;
};

const makePractice = (category: string): PracticeDoc => ({
  _id: { toString: () => 'practice-id' },
  title: `${category} practice`,
  titleUk: `${category} практика`,
  durationMin: 5,
  category,
  thumbnailUrl: null,
  videoUrl: null,
  gradient: 'linear-gradient(...)',
});

describe('AttachmentService', () => {
  let service: AttachmentService;
  let aggregate: jest.Mock;

  beforeEach(() => {
    aggregate = jest.fn();
    const model = { aggregate } as any;
    service = new AttachmentService(model);
  });

  describe('gating — only explicit requests attach', () => {
    it('returns null for pure venting (no request)', async () => {
      const result = await service.detectAndFetch('I feel anxious today', {
        stressLevel: 5,
        emotion: 'Anxious',
      });
      expect(result).toBeNull();
      expect(aggregate).not.toHaveBeenCalled();
    });

    it('returns null for small talk even with elevated stress', async () => {
      const result = await service.detectAndFetch('hey how are you', {
        stressLevel: 8,
        emotion: 'Anxious',
      });
      expect(result).toBeNull();
      expect(aggregate).not.toHaveBeenCalled();
    });

    it('returns null for "I am sad" (no help request)', async () => {
      const result = await service.detectAndFetch('I am sad and lonely', {
        stressLevel: 7,
        emotion: 'Sad',
      });
      expect(result).toBeNull();
    });
  });

  describe('explicit wellness requests attach', () => {
    it('matches "help me relax" with anxiety keyword → Anxiety Relief', async () => {
      aggregate.mockResolvedValueOnce([makePractice('Anxiety Relief')]);
      const result = await service.detectAndFetch(
        'help me relax, I feel anxious',
        { stressLevel: null, emotion: null },
      );
      expect(result).not.toBeNull();
      expect(result!.category).toBe('Anxiety Relief');
    });

    it('matches "give me a practice" with sleep keyword → Sleep', async () => {
      aggregate.mockResolvedValueOnce([makePractice('Sleep')]);
      const result = await service.detectAndFetch(
        'give me a practice, I cannot sleep',
        { stressLevel: 5, emotion: 'Tired' },
      );
      expect(result).not.toBeNull();
      expect(result!.category).toBe('Sleep');
    });

    it('matches Ukrainian "порадь практику для медитації" → Meditation', async () => {
      aggregate.mockResolvedValueOnce([makePractice('Meditation')]);
      const result = await service.detectAndFetch(
        'порадь практику для медитації',
        {
          stressLevel: null,
          emotion: 'Calm',
        },
      );
      expect(result).not.toBeNull();
      expect(result!.category).toBe('Meditation');
    });
  });

  describe('does NOT attach on ambiguous asks', () => {
    it('returns null for bare "show me a video" in casual context', async () => {
      const result = await service.detectAndFetch('will you show me a video?', {
        stressLevel: 1,
        emotion: 'Calm',
      });
      expect(result).toBeNull();
      expect(aggregate).not.toHaveBeenCalled();
    });

    it('returns null for bare Ukrainian "покажеш мені відео?"', async () => {
      const result = await service.detectAndFetch('покажеш мені відео?', {
        stressLevel: 1,
        emotion: 'Calm',
      });
      expect(result).toBeNull();
      expect(aggregate).not.toHaveBeenCalled();
    });

    it('returns null for bare "help me" with no wellness keyword', async () => {
      const result = await service.detectAndFetch('help me', {
        stressLevel: null,
        emotion: null,
      });
      expect(result).toBeNull();
      expect(aggregate).not.toHaveBeenCalled();
    });

    it('returns null for "recommend something" with no wellness topic', async () => {
      const result = await service.detectAndFetch('can you recommend something', {
        stressLevel: 5,
        emotion: 'Tired',
      });
      expect(result).toBeNull();
      expect(aggregate).not.toHaveBeenCalled();
    });
  });
});
