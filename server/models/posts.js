const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const PostSchema = new Schema({
  title: {
    type: String,
    required: true,
    maxlength: 100,
  },
  content: {
    type: String,
    required: true,
  },
  linkFlairID: {
    type: Schema.Types.ObjectId,
    ref: "LinkFlair",
  },
  postedBy: {
    type: String,
    required: true,
  },
  postedDate: {
    type: Date,
    required: true,
    default: Date.now,
  },
  commentIDs: [
    {
      type: Schema.Types.ObjectId,
      ref: "Comment",
      default: [],
    },
  ],
  views: {
    type: Number,
    required: true,
    default: 0,
  },
});

PostSchema.virtual("url").get(function () {
  return `posts/${this._id}`;
});

PostSchema.set("toJSON", { virtuals: true });
PostSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("Post", PostSchema);
