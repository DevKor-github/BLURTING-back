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
import { CreateUserDto, LoginDto } from 'src/dtos/user.dto';
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
} from '@nestjs/swagger';
import {
  SignupTokenResponseDto,
  TokenResponseDto,
} from './dtos/tokenResponseDto';
import { SignupPhoneRequestDto } from './dtos/signupPhoneRequest.dto';
import { SignupEmailRequestDto } from './dtos/signupEmailRequest.dto';
import { SignupImageRequestDto } from './dtos/signupImageRequest.dto';

@Controller('auth')
@ApiTags('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
  ) {}

  @UseGuards(SignupGuard)
  @ApiQuery({
    name: 'code',
    description: '인증번호',
    type: String,
    example: '010123',
  })
  @Post('/check/phone')
  @ApiConflictResponse({ description: '사용 중 전화번호' })
  @ApiBadRequestResponse({ description: 'invalid signup token' })
  @ApiUnauthorizedResponse({ description: '인증번호 오류' })
  @ApiRequestTimeoutResponse({ description: '인증번호 시간 초과' })
  @ApiCreatedResponse({ description: '성공', type: SignupTokenResponseDto })
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

      await this.authService.checkCode(id, code, body.phoneNumber);
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
  @ApiQuery({
    name: 'email',
    description: '이메일',
    type: String,
    example: '123456@korea.ac.kr',
  })
  async checkMail(@Query('code') code: string, @Query('email') email: string) {
    await this.authService.checkMail(code, email);
  }

  @UseGuards(SignupGuard)
  @Post('/signup')
  @ApiCreatedResponse({
    description: 'new signup token',
    type: SignupTokenResponseDto,
  })
  @ApiHeader({
    name: 'authorization',
    required: true,
    example: 'Bearer asdas.asdasd.asd',
  })
  @ApiBody({
    description: '유저 정보 차례대로 하나씩',
    type: CreateUserDto,
  })
  @ApiOperation({
    summary: '회원가입',
    description:
      'signup token과 body의 정보로 회원가입 진행 및 signup token 재발행',
  })
  async signup(
    @Req() req: Request,
    @Body() info: CreateUserDto,
    @Res() res: Response,
  ) {
    try {
      const { id, infoId, page } = req.user as SignupPayload;
      if (page == 16) {
        // email, phoneNumber 저장
        const result = await this.authService.checkComplete(id);
        if (!result) throw new BadRequestException('invalid info');
        return res.json({
          refreshToken: await this.authService.getRefreshToken({
            id: id,
          }),
          accessToken: await this.authService.getAccessToken({
            id: id,
          }),
        });
      }

      const pageName = Object.keys(Page).find((key) => Page[key] == page);
      if (!info[pageName]) throw new BadRequestException('invalid info');
      switch (pageName) {
        case 'userName':
          await this.userService.updateUser(id, 'userName', info['userName']);
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
  async signupStart(@Req() req: Request, @Res() res: Response) {
    try {
      const user = await this.userService.createUser();
      const userInfo = await this.userService.createUserInfo(user);
      const signupToken = await this.authService.getSignupToken({
        id: user.id,
        infoId: userInfo.id,
        page: 0,
      });

      return res.json({ signupToken: signupToken });
    } catch (err) {
      res.status(err.status).json(err);
    }
  }

  @Post('/signup/phonenumber')
  @UseGuards(SignupGuard)
  @ApiOperation({ summary: '휴대폰 인증 요청 - 첫 endpoint' })
  @ApiBadRequestResponse({
    description: 'invalid signup token 또는 전화번호 오류',
  })
  @ApiConflictResponse({ description: '사용 중 전화번호' })
  @ApiNotAcceptableResponse({ description: '10초 내 재요청' })
  @ApiCreatedResponse({
    description: 'new signup token',
    type: SignupTokenResponseDto,
  })
  async signupPhoneNumber(
    @Req() req: Request,
    @Res() res: Response,
    @Body() body: SignupPhoneRequestDto,
  ) {
    try {
      const { id, page } = req.user as SignupPayload;
      if (Page[page] != 'phoneNumber') {
        throw new BadRequestException('invalid signup token');
      }
      await this.authService.validatePhoneNumber(body.phoneNumber, id);
      const signupToken = await this.authService.getSignupToken(
        req.user as SignupPayload,
      );

      return res.json({ signupToken: signupToken });
    } catch (err) {
      console.log(err);
      res.status(err.status).json(err);
    }
  }

  @Post('/signup/images')
  @UseGuards(SignupGuard)
  @ApiBadRequestResponse({ description: 'invalid signup token' })
  @ApiCreatedResponse({
    description: 'new signup token',
    type: SignupTokenResponseDto,
  })
  async signupImage(@Body() body: SignupImageRequestDto, @Req() req: Request) {
    const { id } = req.user as SignupPayload;

    await this.authService.addImages(id, body.images);
    const signupToken = await this.authService.getSignupToken(
      req.user as SignupPayload,
    );
    return { signupToken };
  }

  @Post('/signup/email')
  @UseGuards(SignupGuard)
  @ApiBadRequestResponse({
    description: 'invalid signup token or invalid email',
  })
  @ApiConflictResponse({ description: '이미 가입된 이메일' })
  @ApiNotAcceptableResponse({ description: '10초 내 재요청' })
  @ApiCreatedResponse({
    description: 'new signup token',
    type: SignupTokenResponseDto,
  })
  async signupEmail(
    @Req() req: Request,
    @Res() res: Response,
    @Body() body: SignupEmailRequestDto,
  ) {
    try {
      const { id, page } = req.user as SignupPayload;
      if (Page[page] != 'email') {
        throw new BadRequestException('invalid signup token');
      }
      await this.authService.sendVerificationCode(id, body.email);
      const signupToken = await this.authService.getSignupToken(
        req.user as SignupPayload,
      );

      return res.json({ signupToken: signupToken });
    } catch (err) {
      res.status(err.status).json(err);
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
  async signupBack(@Req() req: Request, @Res() res: Response) {
    try {
      const { id, infoId, page } = req.user as SignupPayload;
      const signupToken = await this.authService.getSignupToken({
        id: id,
        infoId: infoId,
        page: page - 2,
      });

      return res.json({ signupToken: signupToken });
    } catch (err) {
      res.status(err.status).json(err);
    }
  }

  @Post('/login')
  @ApiOperation({ deprecated: true })
  async login(@Body() loginDto: LoginDto, @Res() res: Response) {
    const { id } = loginDto;

    const user = await this.authService.validateUser(id);
    const refreshToken = await this.authService.getRefreshToken({
      id: user.id,
    });
    const accessToken = await this.authService.getAccessToken({ id: user.id });
    return res.json({
      refreshToken: refreshToken,
      accessToken: accessToken,
    });
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
    const accessToken = await this.authService.getAccessToken({ id: id });
    return {
      accessToken: accessToken,
    };
  }
}
