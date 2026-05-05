/* eslint-disable @typescript-eslint/no-require-imports */
// Run with: npm run seed:practices
import { connect, model, Schema } from 'mongoose';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(__dirname, '../../.env') });

const PracticeSchema = new Schema({
  title: String,
  titleUk: String,
  durationMin: Number,
  category: String,
  thumbnailUrl: { type: String, default: null },
  videoUrl: { type: String, default: null },
  gradient: String,
  active: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
});

const PracticeModel = model('Practice', PracticeSchema);

const G = {
  meditation: 'linear-gradient(135deg, #A78BFA 0%, #7C3AED 100%)',
  anxiety: 'linear-gradient(135deg, #93C5FD 0%, #6366F1 100%)',
  sleep: 'linear-gradient(135deg, #818CF8 0%, #4338CA 100%)',
  emotional: 'linear-gradient(135deg, #F9A8D4 0%, #C084FC 100%)',
};

const PRACTICES = [
  {
    title: 'Morning Calm',
    titleUk: 'Ранковий спокій',
    durationMin: 20,
    category: 'Meditation',
    gradient: G.meditation,
  },
  {
    title: 'Anxiety Reset',
    titleUk: 'Скидання тривоги',
    durationMin: 10,
    category: 'Anxiety Relief',
    gradient: G.anxiety,
  },
  {
    title: 'Deep Sleep Journey',
    titleUk: 'Подорож у глибокий сон',
    durationMin: 30,
    category: 'Sleep',
    gradient: G.sleep,
  },
  {
    title: 'Emotional Balance',
    titleUk: 'Емоційний баланс',
    durationMin: 15,
    category: 'Emotional health',
    gradient: G.emotional,
  },
  {
    title: 'Stress Relief',
    titleUk: 'Зняття стресу',
    durationMin: 10,
    category: 'Anxiety Relief',
    gradient: G.anxiety,
  },
  {
    title: 'Mindful Breathing',
    titleUk: 'Усвідомлене дихання',
    durationMin: 7,
    category: 'Meditation',
    gradient: G.meditation,
  },
  {
    title: 'Sleep Wind-Down',
    titleUk: 'Підготовка до сну',
    durationMin: 20,
    category: 'Sleep',
    gradient: G.sleep,
  },
  {
    title: 'Self-Compassion',
    titleUk: 'Самоспівчуття',
    durationMin: 12,
    category: 'Emotional health',
    gradient: G.emotional,
  },
  {
    title: 'Calm Focus',
    titleUk: 'Спокійна зосередженість',
    durationMin: 8,
    category: 'Meditation',
    gradient: G.meditation,
  },
  {
    title: 'Panic Relief',
    titleUk: 'Допомога при паніці',
    durationMin: 5,
    category: 'Anxiety Relief',
    gradient: G.anxiety,
  },
  {
    title: 'Night Routine',
    titleUk: 'Нічна рутина',
    durationMin: 25,
    category: 'Sleep',
    gradient: G.sleep,
  },
  {
    title: 'Healing Journal',
    titleUk: 'Журнал зцілення',
    durationMin: 15,
    category: 'Emotional health',
    gradient: G.emotional,
  },
  {
    title: 'Body Scan',
    titleUk: 'Сканування тіла',
    durationMin: 18,
    category: 'Meditation',
    gradient: G.meditation,
  },
  {
    title: 'Worry Release',
    titleUk: 'Відпускання тривог',
    durationMin: 10,
    category: 'Anxiety Relief',
    gradient: G.anxiety,
  },
  {
    title: 'Moonlight Rest',
    titleUk: 'Місячний спокій',
    durationMin: 30,
    category: 'Sleep',
    gradient: G.sleep,
  },
  {
    title: 'Gratitude Flow',
    titleUk: 'Потік вдячності',
    durationMin: 10,
    category: 'Emotional health',
    gradient: G.emotional,
  },
  {
    title: 'Inner Peace',
    titleUk: 'Внутрішній спокій',
    durationMin: 15,
    category: 'Meditation',
    gradient: G.meditation,
  },
  {
    title: 'Breathe Through',
    titleUk: 'Дихай крізь',
    durationMin: 6,
    category: 'Anxiety Relief',
    gradient: G.anxiety,
  },
  {
    title: 'Power Nap',
    titleUk: 'Відновлювальний сон',
    durationMin: 20,
    category: 'Sleep',
    gradient: G.sleep,
  },
  {
    title: 'Heart Opening',
    titleUk: 'Відкриття серця',
    durationMin: 12,
    category: 'Emotional health',
    gradient: G.emotional,
  },
];

async function seed() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI not set in .env');
    process.exit(1);
  }

  await connect(uri);
  await PracticeModel.deleteMany({});
  await PracticeModel.insertMany(
    PRACTICES.map((p) => ({
      ...p,
      thumbnailUrl: null,
      videoUrl: null,
      active: true,
    })),
  );
  console.log(`Seeded ${PRACTICES.length} practices`);
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
