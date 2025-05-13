const mongoose = require("mongoose");
const { Schema } = mongoose;

const UserSchema = new Schema(
  {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Invalid email format"],
    },
    displayName: { type: String, required: true, unique: true, trim: true },
    passwordHash: { type: String, required: true },
    isAdmin: { type: Boolean, default: false },
    reputation: {
      type: Number,
      default: function () {
        return this.isAdmin ? 1000 : 100;
      },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", UserSchema);
