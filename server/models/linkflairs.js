const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const LinkFlairSchema = new Schema({
  content: {
    type: String,
    required: true,
    maxlength: 30,
  },
});

LinkFlairSchema.virtual("url").get(function () {
  return `linkflairs/${this._id}`;
});

LinkFlairSchema.set("toJSON", { virtuals: true });
LinkFlairSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("LinkFlair", LinkFlairSchema);
