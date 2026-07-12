import { Router } from 'express';
import { rateLimiter } from '../middleware/rateLimiter.js';
import { requireAuth } from '../middleware/auth.js';
import { chat } from '../controllers/ai.controller.js';

const router = Router();

// Auth before rate limiting: an anonymous request shouldn't even get to spend a
// slot in the quota, let alone reach Groq.
router.post('/chat', requireAuth, rateLimiter, chat);

export default router;
