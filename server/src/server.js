import http from 'http';
import app from './app.js';
import connectDB from './config/db.js';
import { initSocket } from './config/socket.js';
import { seedDatabase } from './config/seed.js';

const PORT = process.env.PORT || 5001;

// Create HTTP server so Socket.IO can share the same port
const httpServer = http.createServer(app);

// Initialize Socket.IO
initSocket(httpServer);

// Connect to Database and start server
const startServer = async () => {
  await connectDB();
  // Seed a default verified user for login testing (development only)
  if (process.env.NODE_ENV !== 'production') {
    await seedDatabase();
  }
  httpServer.listen(PORT, () => {
    console.log(`[Server] Running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
    console.log(`[Socket.IO] WebSocket server ready`);
  });
};

startServer();

// Graceful shutdown for in‑memory MongoDB (development only)
if (process.env.NODE_ENV !== 'production') {
  // Ensure the in‑memory server is stopped when the process exits
  const shutdown = async () => {
    try {
      const { stopMemoryServer } = await import('./config/memoryDb.js');
      await stopMemoryServer();
    } catch (e) {
      console.error('Error stopping in‑memory MongoDB:', e);
    } finally {
      process.exit(0);
    }
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}
