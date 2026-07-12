import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

// Assigned once, at registration. It's the colour of your caret in a room, so
// it has to stay the same across sessions — which is exactly what an account is for.
const CARET_COLORS = ['#F59E0B', '#38BDF8', '#A3E635', '#F472B6', '#5EEAD4', '#C084FC', '#FB7185'];

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true, trim: true, minlength: 3, maxlength: 20 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    color: {
      type: String,
      default: () => CARET_COLORS[Math.floor(Math.random() * CARET_COLORS.length)],
    },
  },
  { timestamps: true },
);

// Hashing lives on the model. There is deliberately no way to construct a User
// from a plain password, so no route can forget to hash one.
userSchema.statics.hashPassword = (password) => bcrypt.hash(password, 10);

userSchema.methods.checkPassword = function checkPassword(password) {
  return bcrypt.compare(password, this.passwordHash);
};

/** The only shape that ever leaves the server. Note what's absent: the hash. */
userSchema.methods.toPublic = function toPublic() {
  return {
    id: this._id.toString(),
    username: this.username,
    email: this.email,
    color: this.color,
  };
};

export default mongoose.model('User', userSchema);
