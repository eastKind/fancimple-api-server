require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const { authenticate } = require("./middleware/authenticate.js");
const {
  userRouter,
  sessionRouter,
  postRouter,
  commentRouter,
} = require("./routes");

const app = express();
const PORT = process.env.PORT || 5000;

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connection successful!");

    // middlewares
    app.use(cors({ origin: "http://localhost:8080", credentials: true }));
    app.use("/public", express.static("public"));
    app.use(express.json());
    app.use(cookieParser());
    app.use(authenticate);

    // routes
    app.use("/api/user", userRouter);
    app.use("/api/session", sessionRouter);
    app.use("/api/post", postRouter);
    app.use("/api/comment", commentRouter);

    app.listen(PORT, () => {
      console.log(`Server is listening on port ${PORT}`);
    });
  })
  .catch((err) => console.log(err));
