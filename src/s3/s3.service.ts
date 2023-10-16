import { Injectable, Inject } from '@nestjs/common';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';

@Injectable()
export class S3Service {
  constructor(@Inject('S3Client') private readonly s3: S3Client) {}

  async uploadImage(file: Express.Multer.File) {
    const key = `${Date.now() + file.originalname}`;
    const params = {
      Bucket: process.env.AWS_BUCKET_NAME,
      ACL: process.env.AWS_ACL,
      Key: key,
      Body: file.buffer,
    };

    await this.s3.send(new PutObjectCommand(params));
    return key;
  }

  async deleteImage(key: string) {
    const params = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: key,
    };

    await this.s3.send(new DeleteObjectCommand(params));
  }
}
