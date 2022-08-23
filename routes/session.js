const express = require("express");
const bcrypt = require("bcrypt");
const { User, Session } = require("../models");

const router = express.Router();

// Sign in
router.post("/", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (user) {
      const match = await bcrypt.compare(password, user.password);
      if (match) {
        const session = await Session.create({ user: user.id });
        return res
          .cookie("sessionId", session.id, {
            expires: new Date(Date.now() + 86400000),
            domain: process.env.DOMAIN,
            path: "/",
          })
          .send();
      }
    }
    res.status(400).send({ message: "잘못된 회원 정보입니다." });
  } catch (error) {
    res.status(400).send({ message: error.message });
  }
});

// Sign out
router.delete("/", async (req, res) => {
  try {
    if (!req.sessionId) throw new Error("Invalid Session");
    await Session.findByIdAndRemove(req.sessionId);
    res.clearCookie("sessionId", { domain: process.env.DOMAIN, path: "/" });
    res.send();
  } catch (error) {
    res.status(400).send({ message: error.message });
  }
});

module.exports = router;
