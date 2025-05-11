const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const CommunitySchema = new Schema({
  name: {
    type: String,
    required: true,
    maxlength: 100,
  },
  description: {
    type: String,
    required: true,
    maxlength: 500,
  },
  postIDs: [
    {
      type: Schema.Types.ObjectId,
      ref: "Post",
      default: [],
    },
  ],
  startDate: {
    type: Date,
    required: true,
    default: Date.now,
  },
  members: {
    type: [
      {
        type: String,
        required: true,
      },
    ],
    required: true,
    default: [],
  },
  creator: { type: String, required: true },
});

CommunitySchema.virtual("memberCount").get(function () {
  return this.members.length;
});

CommunitySchema.virtual("url").get(function () {
  return `communities/${this._id}`;
});

CommunitySchema.set("toJSON", { virtuals: true });
CommunitySchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("Community", CommunitySchema);
