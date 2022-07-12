const express = require("express");
const { Post } = require("../models");
const getPaging = require("../utils/getPaging.js");
const upload = require("../middleware/upload.js");
const router = express.Router();

router.get("/", async (req, res) => {
  if (!req.sessionId) throw new Error("인증 실패");
  try {
    const { cursor, limit } = req.query;
    const posts = await Post.find(cursor ? { _id: { $lt: cursor } } : {})
      .populate("writer", "-password")
      .sort({ _id: -1 })
      .limit(limit);
    const paging = await getPaging(Post, cursor, limit);
    res.send({ message: "success", posts, paging });
  } catch (error) {
    res.status(400).send({ message: error.message });
  }
});

router.get("/:id", async (req, res) => {
  if (!req.sessionId) throw new Error("인증 실패");
  try {
    const { id } = req.params;
    const post = await Post.findById(id).populate("writer", "-password");
    res.send({ message: "success", post });
  } catch (error) {
    res.status(400).send({ message: error.message });
  }
});

router.post("/", upload.array("image"), async (req, res) => {
  if (!req.sessionId) throw new Error("인증 실패");
  try {
    const { title, contents = "" } = req.body;
    const images = req.files.map((file) => file.location);
    const post = await Post.create({
      title,
      contents,
      images,
      writer: req.user.id,
    });
    res.send({ message: "success", post });
  } catch (error) {
    res.status(400).send({ message: error.message });
  }
});

module.exports = router;
