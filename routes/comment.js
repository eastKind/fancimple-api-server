const express = require("express");
const { Post, Comment } = require("../models");
const getHasNext = require("../utils/getHasNext");
const router = express.Router();

router.get("/", async (req, res) => {
  try {
    if (!req.sessionId) throw new Error("Invalid Session");
    const { postId, cursor, limit } = req.query;
    const filter = { postId };
    if (cursor) filter._id = { $lt: cursor };
    const comments = await Comment.find(filter)
      .populate({ path: "writer", select: "id name photoUrl" })
      .sort({ _id: -1 })
      .limit(limit);
    const hasNext = await getHasNext(Comment, cursor, limit);
    res.send({ comments, hasNext });
  } catch (error) {
    res.status(400).send({ message: error.message });
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
    await Post.findByIdAndUpdate(postId, { $inc: { commentCount: 1 } });
    await Comment.populate(comment, {
      path: "writer",
      select: "id name photoUrl",
    });
    res.send({ comment });
  } catch (error) {
    res.status(400).send({ message: error.message });
  }
});

router.delete("/:commentId", async (req, res) => {
  try {
    if (!req.sessionId) throw new Error("Invalid Session");
    const { commentId } = req.params;
    const { postId } = req.query;
    await Comment.findByIdAndRemove(commentId);
    await Post.findByIdAndUpdate(postId, { $inc: { commentCount: -1 } });
    res.send({ commentId });
  } catch (error) {
    res.status(400).send({ message: error.message });
  }
});

router.patch("/:id", async (req, res) => {
  try {
    if (!req.sessionId) throw new Error("Invalid Session");
    const { id } = req.params;
    const { contents } = req.body;
    const comment = await Comment.findByIdAndUpdate(
      id,
      { contents },
      { new: true }
    ).populate({ path: "writer", select: "id name photoUrl" });
    res.send({ comment });
  } catch (error) {
    res.status(400).send({ message: error.message });
  }
});

router.patch("/:id/like", async (req, res) => {
  try {
    if (!req.sessionId) throw new Error("Invalid Session");
    const { id } = req.params;
    const { isLike } = req.body;
    const comment = await Comment.findByIdAndUpdate(
      id,
      {
        $inc: { likeCount: isLike ? 1 : -1 },
      },
      { new: true }
    );
    res.send({ comment });
  } catch (error) {
    res.status(400).send({ message: error.message });
  }
});

module.exports = router;
