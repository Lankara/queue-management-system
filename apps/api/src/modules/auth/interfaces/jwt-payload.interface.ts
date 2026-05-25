export interface JwtPayload {
  sub: string;
  email: string | null;
  phone: string | null;
  roles: string[];
  businessIds: string[];
}
