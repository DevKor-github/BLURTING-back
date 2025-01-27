import { ApiProperty } from '@nestjs/swagger';

export class FileUploadDto {
  @ApiProperty({ type: 'array', items: { type: 'string', format: 'binary' } })
  files: any[];
}

export class FileUploadResponseDto {
  @ApiProperty({
    description: 'S3 이미지 URL',
    example: 'https://bucketname.s3.region.amazonaws.com/filename',
  })
  url: string;
}
