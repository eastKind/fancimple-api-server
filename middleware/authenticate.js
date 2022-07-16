const { isValidObjectId } = require("mongoose");
const { Session } = require("../models");

const authenticate = async (req, res, next) => {
  try {
    const { sessionId } = req.cookies;
    if (isValidObjectId(sessionId)) {
      const session = await Session.findById(sessionId).populate(
        "user",
        "-password -createdAt -updatedAt"
      );
      if (session) {
        req.user = session.user;
        req.sessionId = sessionId;
      }
    }
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = { authenticate };
