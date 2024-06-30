import { IsString, IsNumber, IsOptional } from 'class-validator';
import { Character, Hobby } from 'src/common/enums';
import { CharacterMask, HobbyMask } from 'src/common/const';
import { ApiProperty, OmitType } from '@nestjs/swagger';
import { UserInfoEntity } from 'src/domain/entities';
import { SignupUserRequestDto } from 'src/domain/auth/dtos/signupRequest.dto';

export class LoginDto {
  @IsNumber()
  id: number;
}

export class UserProfileDto extends OmitType(SignupUserRequestDto, [
  'birth',
  'phoneNumber',
] as const) {
  @IsOptional()
  @IsString()
  @ApiProperty({ description: 'nickname' })
  nickname: string;

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
      sex: userInfo.sex ?? null,
      sexOrient: userInfo.sexOrient ?? null,
      job: userInfo.job ?? null,
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

export class UserProfileDtoWithBlur extends UserProfileDto {
  @ApiProperty({
    description: '블러 스텝',
    example: 3,
  })
  blur: number;

  static extendUserProfileDto(
    userProfileDto: UserProfileDto,
    blur: number,
  ): UserProfileDtoWithBlur {
    return {
      blur,
      ...userProfileDto,
    };
  }
}
export class UpdateProfileDto extends OmitType(UserProfileDto, [
  'nickname',
  'sex',
  'sexOrient',
] as const) {}