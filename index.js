require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");
const { authenticate } = require("./middleware/authenticate.js");
const app = express();
const PORT = process.env.PORT || 5000;

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("Mongo DB connection successful!");

    app.use("/public", express.static("public"));
    app.use(express.json());
    app.use(cookieParser());
    app.use(authenticate);

    app.listen(PORT, () => {
      console.log(`Server is listening on port ${PORT}`);
    });
  })
  .catch((err) => console.log(err));
