import {
  IsEmail,
  IsPhoneNumber,
  IsString,
  IsNumber,
  IsArray,
  IsEnum,
  IsOptional,
} from 'class-validator';
import {
  Sex,
  SexOrient,
  Mbti,
  Degree,
  Major,
  Character,
  Hobby,
  Religion,
} from 'src/common/enums';
import { ApiProperty } from '@nestjs/swagger';

export class SignupPhoneRequestDto {
  @ApiProperty({ example: '01012345678' })
  @IsPhoneNumber('KR', { message: '올바른 전화번호가 아닙니다.' })
  phoneNumber: string;
}

export class SignupEmailRequestDto {
  @ApiProperty({ example: 'devkor@korea.ac.kr' })
  @IsEmail()
  email: string;
}

export class SignupUserRequestDto {
  @IsOptional()
  @IsPhoneNumber()
  @ApiProperty({ description: 'phoneNumber' })
  phoneNumber: string;

  @IsOptional()
  @IsEnum(Sex)
  @ApiProperty({ description: 'sex', enum: Sex, enumName: 'Sex' })
  sex: Sex;

  @IsOptional()
  @IsEnum(SexOrient)
  @ApiProperty({
    description: 'sexOrient',
    enum: SexOrient,
    enumName: 'SexOrient',
  })
  sexOrient: SexOrient;

  @IsOptional()
  @IsString()
  @ApiProperty({ description: 'region' })
  region: string;

  @IsOptional()
  @IsEnum(Religion)
  @ApiProperty({
    description: 'religion',
    enum: Religion,
    enumName: 'religion',
  })
  religion: Religion;

  @IsOptional()
  @IsEnum(Degree)
  @ApiProperty({ description: 'drink', enum: Degree, enumName: 'Degree' })
  drink: Degree;

  @IsOptional()
  @IsEnum(Degree)
  @ApiProperty({ description: 'cigarette', enum: Degree, enumName: 'Degree' })
  cigarette: Degree;

  @IsOptional()
  @IsNumber()
  @ApiProperty({ description: 'height' })
  height: number;

  @IsOptional()
  @IsEnum(Major)
  @ApiProperty({ description: 'major', enum: Major, enumName: 'Major' })
  major: Major;

  @IsOptional()
  @IsEnum(Mbti)
  @ApiProperty({ description: 'mbti', enum: Mbti, enumName: 'Mbti' })
  mbti: Mbti;

  @IsOptional()
  @IsArray()
  @IsEnum(Character, { each: true })
  @ApiProperty({
    description: 'charater',
    enum: Character,
    enumName: 'Character',
    isArray: true,
  })
  character: Character[];

  @IsOptional()
  @IsArray()
  @IsEnum(Hobby, { each: true })
  @ApiProperty({
    description: 'hobby',
    enum: Hobby,
    enumName: 'Hobby',
    isArray: true,
  })
  hobby: Hobby[];

  @IsOptional()
  @IsArray({ message: 'not valid' })
  @IsString({ each: true })
  @ApiProperty({ example: ['s3.asfsva', 'asdfasdf'] })
  images: string[];
}
