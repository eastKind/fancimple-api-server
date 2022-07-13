const express = require("express");
const { Post, Comment } = require("../models");
const router = express.Router();

router.post("/", async (req, res) => {
  try {
    if (!req.sessionId) throw new Error("Invalid Session");
    const { postId, contents } = req.body;
    const comment = await Comment.create({ contents, writer: req.user.id });
    await Post.findByIdAndUpdate(postId, {
      $push: { comments: comment.id },
      $inc: { commentCount: 1 },
    });
    res.send({ message: "success", comment });
  } catch (error) {
    res.status(400).send({ message: "failure", error });
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
    res.send({ message: "success" });
  } catch (error) {
    res.status(400).send({ message: "failure", error });
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
    res.send({ message: "success", comment });
  } catch (error) {
    res.status(400).send({ message: "failure", error });
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
    res.send({ message: "success", comment });
  } catch (error) {
    res.status(400).send({ message: "failure", error });
  }
});

module.exports = router;
