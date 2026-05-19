import { db } from "../database/prisma-client";
import type { IRefreshTokenRepository } from "../../domain/repositories/refresh-token.repository";
import type { RefreshToken } from "@prisma/client";

export class PrismaRefreshTokenRepository implements IRefreshTokenRepository {
  async create(userId: string, token: string, expiresAt: Date): Promise<RefreshToken> {
    return await db.refreshToken.create({
      data: {
        userId,
        token,
        expiresAt,
      },
    });
  }

  async findByToken(token: string): Promise<RefreshToken | null> {
    return await db.refreshToken.findUnique({
      where: { token },
    });
  }

  async delete(id: string): Promise<void> {
    await db.refreshToken.delete({
      where: { id },
    });
  }

  async deleteByUserId(userId: string): Promise<void> {
    await db.refreshToken.deleteMany({
      where: { userId },
    });
  }
}
