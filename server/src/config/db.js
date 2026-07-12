import mongoose from 'mongoose';
import { config } from './env.js';

export async function connectDatabase() {
  mongoose.set('strictQuery', true);

  try {
    await mongoose.connect(config.mongoUri);
    console.log('[db] connected');
  } catch (err) {
    console.error('\n[db] Could not connect to MongoDB.');
    console.error('[db] Check MONGODB_URI, and that your IP is allowed under Network Access in Atlas.\n');
    console.error(err.message);
    process.exit(1);
  }
}
