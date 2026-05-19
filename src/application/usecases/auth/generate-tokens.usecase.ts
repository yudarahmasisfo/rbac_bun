import type { IRefreshTokenRepository } from "../../../domain/repositories/refresh-token.repository";
import { appConfig } from "../../../config/app.config";

// Interface pembantu untuk mendefinisikan tipe JWT Elysia
interface JwtSigner {
  sign: (payload: any) => Promise<string>;
  verify: (token: string) => Promise<any>;
}

interface GenerateTokensInput {
  userPayload: {
    id: string;
    username: string;
    name: string;
    roles: string[];
    roleIds: string[];
    permissions: string[];
    permissionIds: string[];
  };
  accessJwt: JwtSigner;
  refreshJwt: JwtSigner;
}

export class GenerateTokensUseCase {
  constructor(private refreshTokenRepo: IRefreshTokenRepository) {}

  async execute({ userPayload, accessJwt, refreshJwt }: GenerateTokensInput) {
    const accessToken = await accessJwt.sign(userPayload as any);
    const refreshToken = await refreshJwt.sign({ id: userPayload.id } as any);

    // Hitung tanggal kedaluwarsa refresh token (Gunakan nilai detik dari appConfig * 1000)
    const refreshTokenExpiresAt = new Date(Date.now() + (appConfig.jwt.refreshMaxAge * 1000));

    // Simpan refresh token di database
    await this.refreshTokenRepo.create(userPayload.id, refreshToken, refreshTokenExpiresAt);

    return { accessToken, refreshToken };
  }
}