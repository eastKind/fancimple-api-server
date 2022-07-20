const express = require("express");
const { Post, Comment } = require("../models");
const getHasNext = require("../utils/getHasNext");
const router = express.Router();

router.get("/", async (req, res) => {
  try {
    if (!req.sessionId) throw new Error("Invalid Session");
    const { id, cursor, limit } = req.query;
    const filter = { post: id };
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
    const { id, contents } = req.body;
    const comment = await Comment.create({
      contents,
      writer: req.userId,
      post: id,
    });
    await Post.findByIdAndUpdate(id, {
      $push: { comments: comment.id },
      $inc: { commentCount: 1 },
    });
    await Comment.populate(comment, {
      path: "writer",
      select: "id name photoUrl",
    });
    res.send({ comment });
  } catch (error) {
    res.status(400).send({ message: error.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    if (!req.sessionId) throw new Error("Invalid Session");
    const { id } = req.params;
    await Comment.findByIdAndRemove(id);
    await Post.findByIdAndUpdate(id, {
      $pull: { comments: id },
      $inc: { commentCount: -1 },
    });
    res.send();
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
    );
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
