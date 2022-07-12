const mongoose = require("mongoose");

const sessionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    expireAt: {
      type: Date,
      expires: 86400,
    },
  },
  { versionKey: false, timestamps: true }
);

const Session = mongoose.model("Session", sessionSchema);

module.exports = {
  Session,
};
