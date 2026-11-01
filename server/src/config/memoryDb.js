import { MongoMemoryServer } from 'mongodb-memory-server';

let mongod; // holds the instance

export const startMemoryServer = async () => {
  mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  console.log('[MemoryDB] In‑memory MongoDB started at', uri);
  return uri;
};

export const stopMemoryServer = async () => {
  if (mongod) {
    await mongod.stop();
    console.log('[MemoryDB] In‑memory MongoDB stopped');
  }
};
