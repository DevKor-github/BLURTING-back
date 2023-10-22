import { Controller } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
  ) {}

  @UseGuards(SignupGuard)
  @Post('/signup')
  async signup(
    @Req() req: Request,
    @Body() info: CreateUserDto,
    @Res() res: Response,
  ) {
    const { id, infoId, page } = req.user as SignupPayload;
    if (page > 15) {
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
        // email 인증
        break;
      case 'phoneNumber':
        // phone 인증
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
  async refresh(@Req() req: Request, @Res() res: Response) {
    const { id } = req.user as JwtPayload;
    const accessToken = await this.authService.getAccessToken({ id: id });
    return res.json({
      accessToken: accessToken,
    });
  }
}
