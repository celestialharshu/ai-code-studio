import { Router } from 'express';

import { config } from '../config/env.js';
import { run } from '../controllers/run.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { rateLimiter } from '../middleware/rateLimiter.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

const router = Router();

router.post('/', requireAuth, rateLimiter(config.rateLimit.run), asyncHandler(run));

export default router;
