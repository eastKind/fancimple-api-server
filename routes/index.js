const userRouter = require("./user.js");
const sessionRouter = require("./session.js");

module.exports = {
  user: userRouter,
  session: sessionRouter,
};
