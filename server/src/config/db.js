import mongoose from 'mongoose';

let memoryUri = null;

const connectDB = async () => {
  try {
    // Try connecting using the configured URI (or default local URI)
    const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/civicconnect';
    await mongoose.connect(uri);
    console.log(`MongoDB Connected: ${uri}`);
  } catch (initialError) {
    console.warn('[DB] Initial connection failed:', initialError.message);
    // If we are not in production, fall back to an in‑memory server
    if (process.env.NODE_ENV !== 'production') {
      try {
        console.log('[DB] Starting in‑memory MongoDB as fallback...');
        const { startMemoryServer } = await import('./memoryDb.js');
        memoryUri = await startMemoryServer();
        await mongoose.connect(memoryUri);
        console.log(`MongoDB Connected (in‑memory): ${memoryUri}`);
      } catch (fallbackError) {
        console.error('[DB] Failed to start in‑memory MongoDB:', fallbackError);
        process.exit(1);
      }
    } else {
      // In production we cannot continue without a real DB
      console.error('[DB] Cannot connect to MongoDB in production. Exiting.');
      process.exit(1);
    }
  }
};

export default connectDB;
