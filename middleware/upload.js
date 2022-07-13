const path = require("path");
const multer = require("multer");
const multerS3 = require("multer-s3");
const { v4: uuid } = require("uuid");
const s3 = require("../aws.js");

const FILE_TYPES = ["image/jpeg", "image/png"];

const storage = multerS3({
  s3,
  bucket: process.env.BUCKET,
  key: function (req, file, cb) {
    const extension = path.extname(file.originalname);
    cb(null, uuid() + extension);
  },
});

const fileFilter = (req, file, cb) => {
  if (FILE_TYPES.includes(file.mimetype)) cb(null, true);
  else cb(new Error("invalid file type"), false);
};

const limits = { fileSize: 1024 * 1024 * 5 };

const upload = multer({
  storage,
  fileFilter,
  limits,
});

module.exports = upload;
