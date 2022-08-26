const express = require("express");
const { Post, Comment } = require("../models");
const router = express.Router();

router.get("/", async (req, res) => {
  try {
    if (!req.sessionId) throw new Error("Invalid Session");
    const { postId, cursor, limit } = req.query;
    const post = await Post.findById(postId).populate({
      path: "comments",
      populate: { path: "writer", select: "id name photoUrl" },
      match: cursor ? { _id: { $lt: cursor } } : {},
      options: {
        sort: { _id: -1 },
        limit,
      },
    });
    const hasNext = post.comments.length === Number(limit);
    res.send({ comments: post.comments, hasNext });
  } catch (error) {
    res.status(400).send(error.message);
  }
});

router.post("/", async (req, res) => {
  try {
    if (!req.sessionId) throw new Error("Invalid Session");
    const { postId, contents } = req.body;
    const comment = await Comment.create({
      postId,
      contents,
      writer: req.userId,
    });
    await Post.findByIdAndUpdate(postId, {
      $inc: { commentCount: 1 },
      $push: { comments: comment._id },
    });
    await Comment.populate(comment, {
      path: "writer",
      select: "id name photoUrl",
    });
    res.send({ comment });
  } catch (error) {
    res.status(400).send(error.message);
  }
});

router.delete("/:commentId", async (req, res) => {
  try {
    if (!req.sessionId) throw new Error("Invalid Session");
    const { commentId } = req.params;
    const { postId } = req.query;
    await Comment.findByIdAndRemove(commentId);
    await Post.findByIdAndUpdate(postId, {
      $inc: { commentCount: -1 },
      $pull: { comments: commentId },
    });
    res.send({ id: commentId });
  } catch (error) {
    res.status(400).send(error.message);
  }
});

router.patch("/:id/like", async (req, res) => {
  try {
    if (!req.sessionId) throw new Error("Invalid Session");
    const { id } = req.params;
    const { isLiked } = req.body;
    const comment = await Comment.findByIdAndUpdate(
      id,
      {
        [isLiked ? "$pull" : "$push"]: { likeUsers: req.userId },
      },
      { new: true }
    );
    res.send({ likeUsers: comment.likeUsers });
  } catch (error) {
    res.status(400).send(error.message);
  }
});

module.exports = router;
