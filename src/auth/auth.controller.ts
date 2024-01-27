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
import { UserService } from 'src/user/user.service';
import { JwtPayload, SignupPayload } from 'src/interfaces/auth';
import { SignupGuard } from './guard/signup.guard';
import { Page } from 'src/common/enums/page.enum';
import { CreateUserDto, LoginDto } from 'src/dtos/user.dto';
import { ApiTags } from '@nestjs/swagger';
import {
  TokenResponseDto,
  SignupPhoneRequestDto,
  SignupEmailRequestDto,
  SignupImageRequestDto,
  SignupTokenResponseDto,
} from './dtos';
import { RefreshGuard } from './guard/refresh.guard';
import { SignupUser } from 'src/decorators/signupUser.decorator';
import { User } from 'src/decorators/accessUser.decorator';
import {
  AlreadyCheckDocs,
  AlreadyRegisteredDocs,
  CheckCodeDocs,
  CheckMailDocs,
  LoginDocs,
  RefreshDocs,
  SignupBackDocs,
  SignupDocs,
  SignupEmailDocs,
  SignupImageDocs,
  SignupPhoneNumberDocs,
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

    await this.authService.checkCode(id, code, body.phoneNumber);
    const signupToken = await this.authService.getSignupToken(signupPayload);

    return { signupToken };
  }

  @Get('/check/email')
  @CheckMailDocs()
  async checkMail(
    @Query('code') code: string,
    @Query('email') email: string,
  ): Promise<string> {
    await this.authService.checkMail(code, email);
    return '<h1>가입 완료!</h1>블러팅 앱으로 돌아가주세요.';
  }

  @UseGuards(SignupGuard)
  @Post('/signup')
  @SignupDocs()
  async signup(
    @SignupUser() signupPayload: SignupPayload,
    @Body() info: CreateUserDto,
  ) {
    const { id, infoId, page } = signupPayload;
    if (page == 16) {
      const result = await this.authService.checkComplete(id);
      if (!result) throw new BadRequestException('invalid info');
      await this.userService.createSocketUser(id);
      return {
        refreshToken: await this.authService.getRefreshToken(id),
        accessToken: await this.authService.getAccessToken(id),
        userId: id,
      };
    }

    const pageName = Object.keys(Page).find((key) => Page[key] == page);
    if (info[pageName] == undefined || info[pageName] == null)
      throw new BadRequestException('invalid info');
    switch (pageName) {
      case 'userName':
        await this.userService.updateUser(id, 'userName', info['userName']);
        break;
      default:
        await this.userService.updateUserInfo(infoId, pageName, info[pageName]);
    }

    const signupToken = await this.authService.getSignupToken(signupPayload);

    return { signupToken };
  }

  @Get('/signup/start')
  @SignupStartDocs()
  async signupStart(): Promise<SignupTokenResponseDto> {
    const user = await this.userService.createUser();
    const userInfo = await this.userService.createUserInfo(user);
    const signupToken = await this.authService.getSignupToken({
      id: user.id,
      infoId: userInfo.id,
      page: 0,
    });

    return { signupToken };
  }

  @Post('/signup/phonenumber')
  @UseGuards(SignupGuard)
  @SignupPhoneNumberDocs()
  async signupPhoneNumber(
    @SignupUser() signupPayload: SignupPayload,
    @Body() body: SignupPhoneRequestDto,
  ): Promise<SignupTokenResponseDto> {
    const { id, page } = signupPayload;
    if (Page[page] != 'phoneNumber') {
      throw new BadRequestException('invalid signup token');
    }
    await this.authService.validatePhoneNumber(body.phoneNumber, id);
    const signupToken = await this.authService.getSignupToken(signupPayload);

    return { signupToken };
  }

  @Post('/signup/images')
  @UseGuards(SignupGuard)
  @SignupImageDocs()
  async signupImage(
    @SignupUser() signupPayload: SignupPayload,
    @Body() body: SignupImageRequestDto,
  ): Promise<SignupTokenResponseDto> {
    const { id } = signupPayload;

    await this.userService.updateUserImages(id, body.images);
    const signupToken = await this.authService.getSignupToken(signupPayload);
    return { signupToken };
  }

  @Post('/signup/email')
  @UseGuards(SignupGuard)
  @SignupEmailDocs()
  async signupEmail(
    @SignupUser() signupPayload: SignupPayload,
    @Body() body: SignupEmailRequestDto,
  ): Promise<SignupTokenResponseDto> {
    const { id, page } = signupPayload;
    if (Page[page] != 'email') {
      throw new BadRequestException('invalid signup token');
    }
    await this.authService.sendVerificationCode(id, body.email);
    const signupToken = await this.authService.getSignupToken(signupPayload);

    return { signupToken };
  }

  @Get('/signup/back')
  @UseGuards(SignupGuard)
  @SignupBackDocs()
  async signupBack(
    @SignupUser() signupPayload: SignupPayload,
  ): Promise<SignupTokenResponseDto> {
    const { id, infoId, page } = signupPayload;
    const signupToken = await this.authService.getSignupToken({
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

    const user = await this.authService.validateUser(id);
    const refreshToken = await this.authService.getRefreshToken(user.id);
    const accessToken = await this.authService.getAccessToken(user.id);
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
    const accessToken = await this.authService.getAccessToken(id);
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

  @Post('/alreay/signed/check')
  @AlreadyCheckDocs()
  async alreadyCheck(@Query('code') code: string) {
    const result = await this.authService.checkCodeAlready(code);
    return result;
  }
}
