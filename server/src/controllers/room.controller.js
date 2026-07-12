import Room from '../models/Room.js';
import User from '../models/User.js';

const newRoomId = () => Math.random().toString(36).slice(2, 8);

export async function createRoom(req, res) {
  const room = await Room.create({
    roomId: newRoomId(),
    name: String(req.body?.name ?? '').trim() || 'Untitled room',
    owner: req.user.id,
    members: [req.user.id],
    access: 'private', // private by default; the owner opts in to link sharing
  });

  res.status(201).json({ room: await present(room, req.user.id) });
}

/** Rooms persist now, so you need a way to find your way back to them. */
export async function listRooms(req, res) {
  const rooms = await Room.find({ $or: [{ owner: req.user.id }, { members: req.user.id }] })
    .sort({ updatedAt: -1 })
    .limit(20);

  res.json({ rooms: await Promise.all(rooms.map((room) => present(room, req.user.id))) });
}

export async function getRoom(req, res) {
  const room = await Room.findOne({ roomId: req.params.roomId });
  if (!room) return notFound(res);

  if (!room.allows(req.user.id)) {
    return res.status(403).json({
      error: 'forbidden',
      message: 'This room is private. Ask the owner to invite you.',
    });
  }

  res.json({ room: await present(room, req.user.id) });
}

export async function inviteMember(req, res) {
  const room = await ownedRoom(req, res);
  if (!room) return;

  const identifier = String(req.body?.identifier ?? '').trim().toLowerCase();
  const invitee = await User.findOne({ $or: [{ email: identifier }, { username: identifier }] });

  if (!invitee) {
    return res.status(404).json({
      error: 'not_found',
      message: 'No account with that email or username.',
    });
  }

  if (!room.members.some((member) => String(member) === String(invitee._id))) {
    room.members.push(invitee._id);
    await room.save();
  }

  res.json({ room: await present(room, req.user.id) });
}

export async function removeMember(req, res) {
  const room = await ownedRoom(req, res);
  if (!room) return;

  if (String(room.owner) === req.params.userId) {
    return res.status(400).json({ error: 'bad_request', message: 'The owner cannot be removed.' });
  }

  room.members = room.members.filter((member) => String(member) !== req.params.userId);
  await room.save();

  res.json({ room: await present(room, req.user.id) });
}

export async function setAccess(req, res) {
  const room = await ownedRoom(req, res);
  if (!room) return;

  if (!['private', 'link'].includes(req.body?.access)) {
    return res.status(400).json({ error: 'bad_request', message: 'access must be "private" or "link".' });
  }

  room.access = req.body.access;
  await room.save();

  res.json({ room: await present(room, req.user.id) });
}

async function ownedRoom(req, res) {
  const room = await Room.findOne({ roomId: req.params.roomId });

  if (!room) {
    notFound(res);
    return null;
  }

  if (String(room.owner) !== req.user.id) {
    res.status(403).json({ error: 'forbidden', message: 'Only the room owner can change this.' });
    return null;
  }

  return room;
}

/** The shape the client sees. Note the Yjs blob never appears — that goes over the socket. */
async function present(room, viewerId) {
  await room.populate('members', 'username email color');

  return {
    roomId: room.roomId,
    name: room.name,
    access: room.access,
    isOwner: String(room.owner) === String(viewerId),
    ownerId: String(room.owner),
    members: room.members.map((member) => ({
      id: member._id.toString(),
      username: member.username,
      email: member.email,
      color: member.color,
    })),
  };
}

const notFound = (res) =>
  res.status(404).json({ error: 'not_found', message: 'That room does not exist.' });
