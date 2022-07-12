const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema(
  {
    post: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
    },
    writer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    contents: {
      type: String,
      required: true,
    },
    likeCount: {
      type: Number,
      default: 0,
    },
  },
  { versionKey: false, timestamps: true }
);

const Comment = mongoose.model("Comment", commentSchema);

module.exports = {
  Comment,
};
