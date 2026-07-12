import { Router } from 'express';
import {
  createRoom,
  getRoom,
  inviteMember,
  listRooms,
  removeMember,
  setAccess,
} from '../controllers/room.controller.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// Every room route needs an account — that's what makes a room private at all.
router.use(requireAuth);

router.post('/', asyncHandler(createRoom));
router.get('/', asyncHandler(listRooms));
router.get('/:roomId', asyncHandler(getRoom));

router.post('/:roomId/members', asyncHandler(inviteMember));
router.delete('/:roomId/members/:userId', asyncHandler(removeMember));
router.patch('/:roomId/access', asyncHandler(setAccess));

export default router;
