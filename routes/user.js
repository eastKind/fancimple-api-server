const express = require("express");
const bcrypt = require("bcrypt");
const { User } = require("../models");

const router = express.Router();

router.post("/regiser", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const hash = await bcrypt.hash(password, 10);
    await User.create({ name, email, password: hash });
    res.send({ message: "success" });
  } catch (error) {
    res.status(400).send({ message: error.message });
  }
});

router.put("/edit", async (req, res) => {
  try {
    const doc = {};
    Object.keys(req.body).forEach((key) => {
      doc[key] = req.body[key];
    });
    const user = await User.findByIdAndUpdate(req.user.id, doc, {
      returnDocument: "after",
    });
    res.send({ message: "success", user });
  } catch (error) {
    res.status(400).send({ message: error.message });
  }
});

module.exports = router;
