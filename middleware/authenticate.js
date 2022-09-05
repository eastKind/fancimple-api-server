const { isValidObjectId } = require("mongoose");
const { Session } = require("../models");

const auth = async (req, res, next) => {
  try {
    const { sessionId } = req.cookies;
    if (isValidObjectId(sessionId)) {
      const session = await Session.findById(sessionId);
      if (session) {
        req.userId = session.user;
        req.sessionId = sessionId;
        return next();
      }
    }
    res.status(401).send("세션이 만료되었습니다.");
  } catch (error) {
    next(error);
  }
};

module.exports = auth;
