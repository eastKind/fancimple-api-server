const mongoose = require("mongoose");

const postSchema = new mongoose.Schema(
  {
    contents: String,
    thumbnail: String,
    images: [
      {
        url: String,
        key: String,
      },
    ],
    writer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    likeUsers: [
      {
        type: mongoose.Schema.Types.ObjectId,
      },
    ],
    comments: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Comment",
      },
    ],
    commentCount: {
      type: Number,
      default: 0,
    },
  },
  { versionKey: false, timestamps: true }
);

const Post = mongoose.model("Post", postSchema);

module.exports = {
  Post,
};
