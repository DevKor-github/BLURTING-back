import {
  IsEmail,
  IsPhoneNumber,
  IsString,
  IsNumber,
  IsArray,
  IsEnum,
  ValidateIf,
} from 'class-validator';
import {
  Sex,
  SexOrient,
  Mbti,
  Degree,
  Major,
  University,
  Character,
  Hobby,
  Religion,
} from 'src/common/enums';
import { CharacterMask, HobbyMask } from 'src/common/const';
import { ApiProperty, PickType } from '@nestjs/swagger';
import { UserInfoEntity } from 'src/entities';

export class CreateUserDto {
  @ValidateIf((o) => o.userName !== undefined && o.userName !== null)
  @IsString()
  @ApiProperty({ description: 'userName' })
  userName: string;

  @ValidateIf((o) => o.email !== undefined && o.email !== null)
  @IsEmail()
  @ApiProperty({ description: 'email' })
  email: string;

  @ValidateIf((o) => o.IsPhoneNumber !== undefined && o.IsPhoneNumber !== null)
  @IsPhoneNumber()
  @ApiProperty({ description: 'phoneNumber' })
  phoneNumber: string;

  @ValidateIf((o) => o.sex !== undefined && o.sex !== null)
  @IsEnum(Sex)
  @ApiProperty({ description: 'sex', enum: Sex, enumName: 'Sex' })
  sex: Sex;

  @ValidateIf((o) => o.sexOrient !== undefined && o.sexOrient !== null)
  @IsEnum(SexOrient)
  @ApiProperty({
    description: 'sexOrient',
    enum: SexOrient,
    enumName: 'SexOrient',
  })
  sexOrient: SexOrient;

  @ValidateIf((o) => o.region !== undefined && o.region !== null)
  @IsString()
  @ApiProperty({ description: 'region' })
  region: string;

  @ValidateIf((o) => o.religion !== undefined && o.religion !== null)
  @IsEnum(Religion)
  @ApiProperty({
    description: 'religion',
    enum: Religion,
    enumName: 'religion',
  })
  religion: Religion;

  @ValidateIf((o) => o.drink !== undefined && o.drink !== null)
  @IsEnum(Degree)
  @ApiProperty({ description: 'drink', enum: Degree, enumName: 'Degree' })
  drink: Degree;

  @ValidateIf((o) => o.cigarette !== undefined && o.cigarette !== null)
  @IsEnum(Degree)
  @ApiProperty({ description: 'cigarette', enum: Degree, enumName: 'Degree' })
  cigarette: Degree;

  @ValidateIf((o) => o.height !== undefined && o.height !== null)
  @IsNumber()
  @ApiProperty({ description: 'height' })
  height: number;

  @ValidateIf((o) => o.major !== undefined && o.major !== null)
  @IsEnum(Major)
  @ApiProperty({ description: 'major', enum: Major, enumName: 'Major' })
  major: Major;

  @ValidateIf((o) => o.mbti !== undefined && o.mbti !== null)
  @IsEnum(Mbti)
  @ApiProperty({ description: 'mbti', enum: Mbti, enumName: 'Mbti' })
  mbti: Mbti;

  @ValidateIf((o) => o.character !== undefined && o.character !== null)
  @IsArray()
  @IsEnum(Character, { each: true })
  @ApiProperty({
    description: 'charater',
    enum: Character,
    enumName: 'Character',
    isArray: true,
  })
  character: Character[];

  @ValidateIf((o) => o.hobby !== undefined && o.hobby !== null)
  @IsArray()
  @IsEnum(Hobby, { each: true })
  @ApiProperty({
    description: 'hobby',
    enum: Hobby,
    enumName: 'Hobby',
    isArray: true,
  })
  hobby: Hobby[];

  @ValidateIf((o) => o.university !== undefined && o.university !== null)
  @IsEnum(University)
  @ApiProperty({
    description: 'university',
    enum: University,
    enumName: 'University',
  })
  university: University;
}

export class LoginDto {
  @IsNumber()
  id: number;
}

export class UserProfileDto extends PickType(CreateUserDto, [
  'mbti',
  'region',
  'religion',
  'major',
  'character',
  'height',
  'drink',
  'cigarette',
  'hobby',
] as const) {
  @ValidateIf((o) => o.nickname !== undefined && o.nickname !== null)
  @IsString()
  @ApiProperty({ description: 'nickname' })
  nickname: string;

  @ValidateIf((o) => o.images !== undefined && o.images !== null)
  @IsArray({ message: 'not valid' })
  @ApiProperty({ example: ['s3.asfsva', 'asdfasdf'] })
  images: string[];

  static ToDto(userInfo: UserInfoEntity, images: string[]): UserProfileDto {
    return {
      images: images.length ? images : [],
      nickname: userInfo.user.userNickname ?? null,
      mbti: userInfo.mbti ?? null,
      region: userInfo.region ?? null,
      religion: userInfo.religion ?? null,
      major: userInfo.major ?? null,
      character: this.GetCharacter(userInfo.character ?? 0),
      height: userInfo.height ?? null,
      drink: userInfo.drink ?? null,
      cigarette: userInfo.cigarette ?? null,
      hobby: this.GetHobby(userInfo.hobby ?? 0),
    };
  }

  static GetCharacter(maskedValue: number): Character[] {
    const characterList: Character[] = [];
    for (const key in CharacterMask) {
      if (maskedValue & CharacterMask[key]) {
        CharacterMask[key];
        characterList.push(Character[key]);
      }
    }
    return characterList;
  }

  static GetHobby(maskedValue: number): Hobby[] {
    const hobbyList: Hobby[] = [];
    for (const key in HobbyMask) {
      if (maskedValue & HobbyMask[key]) {
        hobbyList.push(Hobby[key]);
      }
    }
    return hobbyList;
  }
}

export class UpdateProfileDto extends PickType(UserProfileDto, [
  'region',
  'religion',
  'drink',
  'cigarette',
  'major',
  'mbti',
  'character',
  'hobby',
  'images',
] as const) {}
