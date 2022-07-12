const mongoose = require("mongoose");

const postSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    contents: String,
    images: [
      {
        type: String,
      },
    ],
    writer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    likeCount: {
      type: Number,
      default: 0,
    },
    commentCount: {
      type: Number,
      default: 0,
    },
    comments: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Comment",
      },
    ],
  },
  { versionKey: false, timestamps: true }
);

const Post = mongoose.model("Post", postSchema);

module.exports = {
  Post,
};
