import {
  Controller,
  Body,
  Req,
  Res,
  Post,
  UseGuards,
  Query,
  Get,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { UserService } from 'src/user/user.service';
import { JwtPayload, SignupPayload } from 'src/interfaces/auth';
import { SignupGuard } from './guard/signup.guard';
import { Page } from 'src/common/enums/page.enum';
import { CreateUserDto, LoginDto } from 'src/dtos/createUser.dto';
import {
  ApiCreatedResponse,
  ApiHeader,
  ApiOperation,
  ApiQuery,
  ApiTags,
  ApiBody,
} from '@nestjs/swagger';
import {
  SignupTokenResponseDto,
  TokenResponseDto,
} from './dtos/tokenResponseDto';

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
  async checkCode(
    @Req() req: Request,
    @Res() res: Response,
    @Query('code') code: string,
    @Body() number: string,
  ) {
    const { id } = req.user as SignupPayload;

    this.authService.checkCode(id, code, number);
    const signupToken = await this.authService.getSignupToken(
      req.user as SignupPayload,
    );

    return res.json({ signupToken: signupToken });
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
    const { id, infoId, page } = req.user as SignupPayload;
    if (page > 16) {
      // email, phoneNumber 저장
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

    switch (pageName) {
      case 'email':
        this.authService.sendVerificationCode(id, info.email);
        break;
      case 'phoneNumber':
        this.authService.validatePhoneNumber(info.phoneNumber, id);
        break;
      case 'checkPhoneNumber':
        // TODO: err
        break;
      case 'userName':
        this.userService.updateUser(id, 'userName', info['userName']);
        break;
      default:
        this.userService.updateUserInfo(infoId, pageName, info[pageName]);
    }

    const signupToken = await this.authService.getSignupToken(
      req.user as SignupPayload,
    );

    return res.json({ signupToken: signupToken });
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
