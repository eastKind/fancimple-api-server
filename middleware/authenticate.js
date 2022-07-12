const { isValidObjectId } = require("mongoose");
const { Session } = require("../models");

const authenticate = async (req, res, next) => {
  try {
    const { sessionId } = req.cookies;
    if (isValidObjectId(sessionId)) {
      const session = await Session.findById(sessionId).populate(
        "user",
        "-password"
      );
      if (session) {
        req.user = session.user;
        req.sessionId = sessionId;
        next();
      }
    }
    throw new Error("세션이 존재하지 않습니다.");
  } catch (error) {
    next(error);
  }
};

module.exports = { authenticate };
