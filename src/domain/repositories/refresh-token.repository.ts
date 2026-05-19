import type { RefreshToken } from "@prisma/client";

export interface IRefreshTokenRepository {
  create(userId: string, token: string, expiresAt: Date): Promise<RefreshToken>;
  findByToken(token: string): Promise<RefreshToken | null>;
  delete(id: string): Promise<void>;
  deleteByUserId(userId: string): Promise<void>;
}