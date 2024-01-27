import {
  Controller,
  Body,
  Req,
  Res,
  Post,
  UseGuards,
  Query,
  Get,
  BadRequestException,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { UserService } from 'src/user/user.service';
import { JwtPayload, SignupPayload } from 'src/interfaces/auth';
import { SignupGuard } from './guard/signup.guard';
import { Page } from 'src/common/enums/page.enum';
import { LoginDto } from 'src/dtos/user.dto';
import {
  ApiCreatedResponse,
  ApiHeader,
  ApiOperation,
  ApiQuery,
  ApiTags,
  ApiBody,
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiNotAcceptableResponse,
  ApiUnauthorizedResponse,
  ApiRequestTimeoutResponse,
  ApiNotFoundResponse,
} from '@nestjs/swagger';
import {
  SignupTokenResponseDto,
  TokenResponseDto,
} from './dtos/tokenResponseDto';
import {
  SignupEmailRequestDto,
  SignupPhoneRequestDto,
  SignupUserRequestDto,
} from './dtos/signupRequest.dto';

@Controller('auth')
@ApiTags('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
  ) {}

  @UseGuards(SignupGuard)
  @Post('/check/phone')
  @ApiConflictResponse({ description: '사용 중 전화번호' })
  @ApiBadRequestResponse({ description: 'invalid signup token' })
  @ApiUnauthorizedResponse({ description: '인증번호 오류' })
  @ApiRequestTimeoutResponse({ description: '인증번호 시간 초과' })
  @ApiCreatedResponse({ description: '성공', type: SignupTokenResponseDto })
  @ApiQuery({
    name: 'code',
    description: '인증번호',
    type: String,
    example: '010123',
  })
  @ApiBody({ description: 'phone', type: SignupPhoneRequestDto })
  async checkCode(
    @Req() req: Request,
    @Query('code') code: string,
    @Body() body: SignupPhoneRequestDto,
  ) {
    try {
      const { id, page } = req.user as SignupPayload;
      if (Page[page] != 'checkPhoneNumber') {
        throw new BadRequestException('invalid signup token');
      }

      await this.authService.checkCode(code, body.phoneNumber);
      await this.userService.updateUser(id, 'phoneNumber', body.phoneNumber);
      const signupToken = await this.authService.getSignupToken(
        req.user as SignupPayload,
      );
      return { signupToken: signupToken };
    } catch (err) {
      console.log(err);
      return err;
    }
  }

  @Get('/check/email')
  @ApiOperation({
    summary: '이메일 인증',
    description: '이메일 인증',
  })
  @ApiQuery({
    name: 'code',
    description: '인증 코드',
    type: String,
    example: '123456',
  })
  @ApiBody({ description: 'email', type: SignupEmailRequestDto })
  async checkMail(
    @Query('code') code: string,
    @Body() body: SignupEmailRequestDto,
  ) {
    await this.authService.checkMail(code, body.email);
    return '<h1>가입 완료!</h1>블러팅 앱으로 돌아가주세요.';
  }

  @UseGuards(SignupGuard)
  @Post('/signup')
  @ApiCreatedResponse({
    description: 'new signup token',
    type: SignupTokenResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'invalid signup token or invalid info',
  })
  @ApiConflictResponse({ description: '이미 가입된 정보' })
  @ApiNotAcceptableResponse({ description: '10초 내 재요청' })
  @ApiHeader({
    name: 'authorization',
    required: true,
    example: 'Bearer asdas.asdasd.asd',
  })
  @ApiBody({
    description: '유저 정보 차례대로 하나씩',
    type: SignupUserRequestDto,
  })
  @ApiOperation({
    summary: '회원가입',
    description:
      'signup token과 body의 정보로 회원가입 진행 및 signup token 재발행',
  })
  async signup(
    @Req() req: Request,
    @Body() info: SignupUserRequestDto,
    @Res() res: Response,
  ) {
    try {
      const { id, infoId, page } = req.user as SignupPayload;
      if (page == 16) {
        const result = await this.authService.checkComplete(id);
        if (!result) throw new BadRequestException('invalid info');
        await this.userService.createSocketUser(id);
        return res.json({
          refreshToken: await this.authService.getRefreshToken({
            id: id,
          }),
          accessToken: await this.authService.getAccessToken({
            id: id,
          }),
          userId: id,
        });
      }

      const pageName = Object.keys(Page).find((key) => Page[key] == page);
      if (info[pageName] == undefined || info[pageName] == null)
        throw new BadRequestException('invalid info');
      switch (pageName) {
        case 'phoneNumber':
          await this.authService.validatePhoneNumber(info['phoneNumber'], id);
          break;
        case 'image':
          await this.userService.updateUserImages(id, info['images']);
          break;
        case 'email':
          await this.authService.validateEmail(id, info['email']);
          break;
        default:
          await this.userService.updateUserInfo(
            infoId,
            pageName,
            info[pageName],
          );
      }

      const signupToken = await this.authService.getSignupToken(
        req.user as SignupPayload,
      );

      return res.json({ signupToken: signupToken });
    } catch (err) {
      res.status(err.status).json(err);
    }
  }

  @Get('/signup/start')
  @ApiCreatedResponse({
    description: 'new signup token',
    type: SignupTokenResponseDto,
  })
  @ApiOperation({
    summary: '회원가입 시작',
    description: '첫 signup token 발행',
  })
  async signupStart() {
    try {
      const user = await this.userService.createUser();
      const userInfo = await this.userService.createUserInfo(user);
      const signupToken = await this.authService.getSignupToken({
        id: user.id,
        infoId: userInfo.id,
        page: 0,
      });

      return { signupToken: signupToken };
    } catch (err) {
      return err;
    }
  }

  @Get('/signup/back')
  @UseGuards(SignupGuard)
  @ApiBadRequestResponse({
    description: 'invalid signup token',
  })
  @ApiCreatedResponse({
    description: 'new signup token',
    type: SignupTokenResponseDto,
  })
  @ApiOperation({
    summary: '회원가입 뒤로가기',
    description: '이전 signup token 발행',
  })
  async signupBack(@Req() req: Request) {
    try {
      const { id, infoId, page } = req.user as SignupPayload;
      const signupToken = await this.authService.getSignupToken({
        id: id,
        infoId: infoId,
        page: page - 2,
      });

      return { signupToken: signupToken };
    } catch (err) {
      return err;
    }
  }

  @Post('/login')
  @ApiOperation({ deprecated: true })
  async login(@Body() loginDto: LoginDto) {
    const { id } = loginDto;

    const user = await this.userService.findUserByVal('id', id);
    const refreshToken = await this.authService.getRefreshToken({
      id: user.id,
    });
    const accessToken = await this.authService.getAccessToken({ id: user.id });
    return {
      id: user.id,
      refreshToken: refreshToken,
      accessToken: accessToken,
    };
  }

  @UseGuards(AuthGuard('refresh'))
  @Post('/refresh')
  @ApiCreatedResponse({
    description: 'new access token',
    type: TokenResponseDto,
  })
  @ApiHeader({
    name: 'authorization',
    required: true,
    example: 'Bearer asdas.asdasd.asd',
  })
  @ApiOperation({
    summary: 'accesstoken 갱신',
    description: 'refresh token으로 access token 갱신',
  })
  async refresh(@Req() req: Request): Promise<TokenResponseDto> {
    const { id } = req.user as JwtPayload;
    const refreshToken = await this.authService.getRefreshToken({
      id: id,
    });
    const accessToken = await this.authService.getAccessToken({ id: id });
    return {
      refreshToken: refreshToken,
      accessToken: accessToken,
    };
  }

  @Post('/already/signed')
  @ApiNotFoundResponse({ description: '없는 번호' })
  @ApiNotAcceptableResponse({ description: '10초 내 재요청' })
  async alreadyRegistered(@Body() body: SignupPhoneRequestDto) {
    await this.authService.alreadySigned(body.phoneNumber);
  }

  @Post('/alreay/signed/check')
  @ApiBadRequestResponse({ description: 'invalid code' })
  @ApiRequestTimeoutResponse({ description: '3분지남' })
  @ApiCreatedResponse({ description: '성공', type: TokenResponseDto })
  @ApiQuery({
    name: 'code',
    description: '인증번호',
    type: String,
    example: '010123',
  })
  async alreadyCheck(
    @Query('code') code: string,
    @Body() body: SignupPhoneRequestDto,
  ) {
    try {
      await this.authService.checkCode(code, body.phoneNumber);
      const user = await this.userService.findUserByPhone(body.phoneNumber);
      const refreshJwt = await this.authService.getRefreshToken({
        id: user.id,
      });
      const accessJwt = await this.authService.getAccessToken({ id: user.id });
      return { refreshToken: refreshJwt, accessToken: accessJwt, id: user.id };
    } catch (err) {
      console.log(err);
      return err;
    }
  }
}
