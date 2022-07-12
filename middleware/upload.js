const path = require("path");
const multer = require("multer");
const multerS3 = require("multer-s3");
const { v4: uuid } = require("uuid");
// const aws = require('aws-sdk');
const { S3Client } = require("@aws-sdk/client-s3");

const FILE_TYPES = ["image/jpeg", "image/png"];

const s3 = new S3Client({
  credentials: {
    accessKeyId: process.env.ACCESS_KEY,
    secretAccessKey: process.env.SECRET_ACCESS_KEY,
  },
  region: "ap-northeast-2",
});

// const s3 = new aws.S3({
//   credentials: {
//     accessKeyId: process.env.ACCESS_KEY,
//     secretAccessKey: process.env.SECRET_ACCESS_KEY,
//   },
//   region: 'ap-northeast-2',
// });

const storage = multerS3({
  s3,
  bucket: "eastkind-sns",
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
