import mongoose from 'mongoose';

const roomSchema = new mongoose.Schema(
  {
    roomId: { type: String, required: true, unique: true, index: true },
    name: { type: String, default: 'Untitled room', trim: true, maxlength: 60 },

    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

    /**
     * private — only the people in members[] can get in. The default.
     * link    — anyone signed in who has the link can get in, and joining puts
     *           them on members[], so they keep access if it's later made private.
     */
    access: { type: String, enum: ['private', 'link'], default: 'private' },

    /**
     * The Yjs document as a binary snapshot (Y.encodeStateAsUpdate).
     * This is the whole reason a room survives a server restart.
     */
    state: { type: Buffer, default: null },
  },
  { timestamps: true },
);

/**
 * The single source of truth for "can this person open this room".
 * Both the REST API and the websocket call this — if the rule lived in two
 * places, one of them would eventually be wrong.
 */
roomSchema.methods.allows = function allows(userId) {
  const id = String(userId);

  if (String(this.owner) === id) return true;
  if (this.members.some((member) => String(member) === id)) return true;

  return this.access === 'link';
};

export default mongoose.model('Room', roomSchema);
