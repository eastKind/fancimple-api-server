const aws = require("aws-sdk");

const s3 = new aws.S3({
  credentials: {
    accessKeyId: process.env.ACCESS_KEY,
    secretAccessKey: process.env.SECRET_ACCESS_KEY,
  },
  region: "ap-northeast-2",
});

// const { S3Client } = require('@aws-sdk/client-s3');

// const s3 = new S3Client({
//   credentials: {
//     accessKeyId: process.env.ACCESS_KEY,
//     secretAccessKey: process.env.SECRET_ACCESS_KEY,
//   },
//   region: 'ap-northeast-2',
// });

module.exports = s3;
