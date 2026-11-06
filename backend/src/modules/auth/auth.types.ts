export type Role = 'user' | 'admin';

export interface UserRecord {
  id: number;
  email: string;
  password_hash: string;
  role: Role;
}

export interface AuthUser {
  id: number;
  email: string;
  role: Role;
  exp: number;
}
