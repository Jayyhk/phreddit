const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const CommentSchema = new Schema({
  content: {
    type: String,
    required: true,
    maxlength: 500,
  },
  commentIDs: [
    {
      type: Schema.Types.ObjectId,
      ref: "Comment",
      default: [],
    },
  ],
  commentedBy: {
    type: String,
    required: true,
  },
  commentedDate: {
    type: Date,
    required: true,
    default: Date.now,
  },
  upvoters: {
    type: [String],
    default: [],
  },
  downvoters: {
    type: [String],
    default: [],
  },
});

CommentSchema.virtual("url").get(function () {
  return `comments/${this._id}`;
});

CommentSchema.set("toJSON", { virtuals: true });
CommentSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("Comment", CommentSchema);
