import {
  Controller,
  Post,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { S3Service } from './s3.service';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiConsumes,
  ApiCreatedResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { FileUploadDto, FileUploadResponseDto } from './dtos/fileUploadDto';

@ApiTags('s3')
@Controller('s3')
export class S3Controller {
  constructor(private readonly s3Service: S3Service) {}

  @Post('')
  @UseInterceptors(FilesInterceptor('files', 10))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: '이미지 업로드',
    description: '이미지 파일 S3에 업로드 후 링크 반환',
  })
  @ApiBody({
    description: '이미지 파일 리스트',
    type: FileUploadDto,
  })
  @ApiCreatedResponse({
    description: '이미지 업로드 성공',
    type: [FileUploadResponseDto],
  })
  @ApiBadRequestResponse({ description: '이미지 업로드 실패' })
  async uploadFiles(@UploadedFiles() files: Express.Multer.File[]) {
    const imgurl: FileUploadResponseDto[] = [];
    await Promise.all(
      files.map(async (file: Express.Multer.File) => {
        const key = await this.s3Service.uploadImage(file);
        const fileUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
        imgurl.push({ url: fileUrl });
      }),
    );

    return imgurl;
  }
}
