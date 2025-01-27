import { Module } from '@nestjs/common';
import { S3Client } from '@aws-sdk/client-s3';
import { S3Controller } from './s3.controller';
import { S3Service } from './s3.service';

@Module({
  controllers: [S3Controller],
  providers: [
    S3Service,
    {
      provide: 'S3Client',
      useFactory: () => {
        return new S3Client({
          credentials: {
            accessKeyId: process.env.S3_ACCESS_KEY,
            secretAccessKey: process.env.S3_SECRET_KEY,
          },
          region: process.env.AWS_REGION,
        });
      },
    },
  ],
  exports: [S3Service],
})
export class S3Module {}
