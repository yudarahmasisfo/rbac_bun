import type { IRefreshTokenRepository } from "../../../domain/repositories/refresh-token.repository";

export class RevokeRefreshTokenUseCase {
  constructor(private refreshTokenRepo: IRefreshTokenRepository) {}

  async execute(token: string) {
    const existingToken = await this.refreshTokenRepo.findByToken(token);
    if (existingToken) {
      await this.refreshTokenRepo.delete(existingToken.id);
    }
  }

  async executeByUserId(userId: string) {
    await this.refreshTokenRepo.deleteByUserId(userId);
  }
}