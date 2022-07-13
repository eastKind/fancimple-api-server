const express = require("express");
const bcrypt = require("bcrypt");
const { User, Session } = require("../models");

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (user) {
      const match = await bcrypt.compare(password, user.password);
      if (match) {
        const session = await Session.create({ user: user.id });
        res
          .cookie("sessionId", session.id, {
            expires: new Date(Date.now() + 86400),
          })
          .send({ message: "success" });
      }
    }
  } catch (error) {
    res.status(400).send({ message: error.message });
  }
});

router.delete("/", async (req, res) => {
  if (!req.sessionId) throw new Error("인증 실패");
  try {
    await Session.findByIdAndRemove(req.sessionId);
    res.clearCookie("sessionId");
    res.send({ message: "success" });
  } catch (error) {
    res.status(400).send({ message: error.message });
  }
});

module.exports = router;
