import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const s3 = new S3Client({
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY,
    secretAccessKey: process.env.S3_SECRET_KEY,
  },
  region: process.env.AWS_REGION,
});

export const uploadImage = async (file: Express.Multer.File) => {
  const key = `${Date.now() + file.originalname}`;
  const params = {
    Bucket: process.env.AWS_BUCKET_NAME,
    ACL: '',
    Key: key,
    Body: file.buffer,
  };

  const command = new PutObjectCommand(params);
  const response = s3.send(command);
  return response;
};
