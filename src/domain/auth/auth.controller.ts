import {
  Controller,
  Body,
  Post,
  UseGuards,
  Query,
  Get,
  BadRequestException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { UserService } from 'src/domain/user/user.service';
import { JwtPayload, SignupPayload } from 'src/interfaces/auth';
import { SignupGuard } from './guard/signup.guard';
import { Page } from 'src/common/enums/page.enum';
import { LoginDto } from 'src/domain/dtos/user.dto';
import { ApiTags } from '@nestjs/swagger';
import {
  SignupTokenResponseDto,
  TokenResponseDto,
  SignupPhoneRequestDto,
  SignupUserRequestDto,
} from './dtos';
import { RefreshGuard } from './guard/refresh.guard';
import { SignupUser } from 'src/decorators/signupUser.decorator';
import { User } from 'src/decorators/accessUser.decorator';
import {
  AlreadyCheckDocs,
  AlreadyRegisteredDocs,
  CheckCodeDocs,
  LoginDocs,
  RefreshDocs,
  SignupBackDocs,
  SignupDocs,
  SignupStartDocs,
} from 'src/decorators/swagger/auth.decorator';
@Controller('auth')
@ApiTags('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
  ) {}

  @UseGuards(SignupGuard)
  @Post('/check/phone')
  @CheckCodeDocs()
  async checkCode(
    @SignupUser() signupPayload: SignupPayload,
    @Query('code') code: string,
    @Body() body: SignupPhoneRequestDto,
  ): Promise<SignupTokenResponseDto> {
    const { id, page } = signupPayload;
    if (Page[page] != 'checkPhoneNumber') {
      throw new BadRequestException('invalid signup token');
    }
    await this.authService.checkCode(code, body.phoneNumber);
    await this.userService.updateUser(id, 'phoneNumber', body.phoneNumber);
    const signupToken = await this.authService.getSignupToken(signupPayload);

    return { signupToken };
  }

  @UseGuards(SignupGuard)
  @Post('/signup')
  @SignupDocs()
  async signup(
    @SignupUser() signupPayload: SignupPayload,
    @Body() info: SignupUserRequestDto,
  ) {
    const { id, infoId, page } = signupPayload;
    if (page == 17) {
      const result = await this.authService.checkComplete(id);
      if (!result) throw new BadRequestException('invalid info');

      const nickname = await this.userService.pickRandomNickname();
      await this.userService.updateUser(id, 'userNickname', nickname);
      await this.userService.createSocketUser(id);
      return {
        refreshToken: await this.authService.getRefreshToken(id),
        accessToken: this.authService.getAccessToken(id),
        userId: id,
      };
    }

    const pageName = Object.keys(Page).find((key) => Page[key] == page);

    if (info[pageName] == undefined || info[pageName] == null)
      throw new BadRequestException('invalid info');

    switch (pageName) {
      case 'phoneNumber':
        await this.authService.validatePhoneNumber(info['phoneNumber']);
        break;
      case 'images':
        await this.userService.updateUserImages(id, info['images']);
        break;
      case 'birth':
        await this.userService.updateUser(id, 'birth', info['birth']);
        break;
      default:
        await this.userService.updateUserInfo(infoId, pageName, info[pageName]);
    }

    const signupToken = this.authService.getSignupToken(signupPayload);

    return { signupToken };
  }

  @Get('/signup/start')
  @SignupStartDocs()
  async signupStart(): Promise<SignupTokenResponseDto> {
    const user = await this.userService.createUser();
    const userInfo = await this.userService.createUserInfo(user);
    const signupToken = this.authService.getSignupToken({
      id: user.id,
      infoId: userInfo.id,
      page: 0,
    });

    return { signupToken };
  }

  @Get('/signup/back')
  @UseGuards(SignupGuard)
  @SignupBackDocs()
  async signupBack(
    @SignupUser() signupPayload: SignupPayload,
  ): Promise<SignupTokenResponseDto> {
    const { id, infoId, page } = signupPayload;
    const signupToken = this.authService.getSignupToken({
      id,
      infoId,
      page: page - 2,
    });

    return { signupToken };
  }

  @Post('/login')
  @LoginDocs()
  async login(@Body() loginDto: LoginDto) {
    const { id } = loginDto;

    const user = await this.userService.findUserByVal('id', id);
    const refreshToken = await this.authService.getRefreshToken(user.id);
    const accessToken = this.authService.getAccessToken(user.id);
    return {
      id: user.id,
      refreshToken,
      accessToken,
    };
  }

  @UseGuards(RefreshGuard)
  @Post('/refresh')
  @RefreshDocs()
  async refresh(@User() user: JwtPayload): Promise<TokenResponseDto> {
    const { id } = user;
    const refreshToken = await this.authService.getRefreshToken(id);
    const accessToken = this.authService.getAccessToken(id);
    return {
      refreshToken,
      accessToken,
    };
  }

  @Post('/already/signed')
  @AlreadyRegisteredDocs()
  async alreadyRegistered(@Body() body: SignupPhoneRequestDto): Promise<void> {
    await this.authService.alreadySigned(body.phoneNumber);
  }

  @Post('/already/signed/check')
  @AlreadyCheckDocs()
  async alreadyCheck(
    @Query('code') code: string,
    @Body() body: SignupPhoneRequestDto,
  ) {
    await this.authService.checkCode(code, body.phoneNumber);
    const user = await this.userService.findUserByPhone(body.phoneNumber);
    const refreshJwt = await this.authService.getRefreshToken(user.id);
    const accessJwt = await this.authService.getAccessToken(user.id);
    return { refreshToken: refreshJwt, accessToken: accessJwt, id: user.id };
  }
}
