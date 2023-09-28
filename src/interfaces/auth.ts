export interface User {
  id: number;
}

export interface JwtPayload extends User {
  signedAt: string;
}

export interface RefreshTokenPayload extends JwtPayload {
  refreshToken: string;
}
