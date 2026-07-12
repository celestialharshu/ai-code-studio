import http from 'node:http';
import express from 'express';
import cors from 'cors';
import { Server } from 'socket.io';

import { config } from './config/env.js';
import { corsOrigin } from './config/cors.js';
import { connectDatabase } from './config/db.js';

import authRoutes from './routes/auth.routes.js';
import roomRoutes from './routes/room.routes.js';
import aiRoutes from './routes/ai.routes.js';
import { attachCollab } from './collab/socket.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';

const app = express();

// Render sits behind a proxy. Without this, req.ip is always the proxy's address
// and the rate limiter would treat every user on earth as the same person.
app.set('trust proxy', 1);

app.use(cors({ origin: corsOrigin }));
app.use(express.json({ limit: '1mb' }));

app.get('/api/health', (req, res) => {
  res.json({ ok: true, model: config.groqModel, uptime: Math.round(process.uptime()) });
});

app.use('/api/auth', authRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/ai', aiRoutes);

app.use(notFound);
app.use(errorHandler);

// Socket.IO needs the raw HTTP server, not the Express app, because it has to
// hijack the connection to upgrade it to a websocket.
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: corsOrigin } });

attachCollab(io);

// Don't accept a single request until the database is actually there.
await connectDatabase();

server.listen(config.port, () => {
  console.log(`[server] http://localhost:${config.port}`);
  console.log(`[server] model: ${config.groqModel}`);
  console.log('[server] auth + private rooms: ready');
});
