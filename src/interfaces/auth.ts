export interface User {
  id: number;
}

export interface JwtPayload extends User {
  signedAt: string;
}

export interface RefreshJwtPayload extends JwtPayload {
  refreshToken: string;
}

export interface SignupPayload extends User {
  infoId: number;
  page: number;
}
