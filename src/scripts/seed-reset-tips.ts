// Run with: npm run seed:resets
import { connect, model, Schema } from 'mongoose';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(__dirname, '../../.env') });

const ResetTipSchema = new Schema({ en: String, uk: String });
const ResetTipModel = model('ResetTip', ResetTipSchema, 'resettips');

const TIPS = [
  {
    en: 'Take 5 slow deep breaths.',
    uk: 'Зробіть 5 повільних глибоких вдихів.',
  },
  {
    en: 'Stand up and stretch your shoulders for 30 seconds.',
    uk: 'Встаньте і розтягніть плечі протягом 30 секунд.',
  },
  {
    en: 'Drink a glass of water and pause for a moment.',
    uk: 'Випийте склянку води та зробіть невелику паузу.',
  },
  {
    en: 'Look away from the screen and relax your eyes for 1 minute.',
    uk: 'Відведіть погляд від екрана та розслабте очі на 1 хвилину.',
  },
  {
    en: 'Take a short 2-minute walk.',
    uk: 'Пройдіться протягом 2 хвилин.',
  },
  {
    en: 'Close your eyes and focus on your breathing for 30 seconds.',
    uk: 'Закрийте очі та зосередьтесь на диханні на 30 секунд.',
  },
  {
    en: 'Think of one thing you are grateful for today.',
    uk: 'Подумайте про одну річ, за яку ви сьогодні вдячні.',
  },
  {
    en: 'Roll your shoulders and relax your neck.',
    uk: 'Повільно покрутіть плечима та розслабте шию.',
  },
  {
    en: 'Smile gently and take a slow breath.',
    uk: 'Легко посміхніться та зробіть повільний вдих.',
  },
  {
    en: 'Step away from your screen for a moment and reset your mind.',
    uk: 'Відійдіть на хвилину від екрана та дайте собі невелику паузу.',
  },
];

async function seed() {
  const uri = process.env['MONGODB_URI'];
  if (!uri) throw new Error('MONGODB_URI is not set');

  await connect(uri);
  console.log('Connected to MongoDB');

  await ResetTipModel.deleteMany({});
  await ResetTipModel.insertMany(TIPS);
  console.log(`Seeded ${TIPS.length} reset tips`);

  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
