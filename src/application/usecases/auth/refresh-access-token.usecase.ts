import type { IRefreshTokenRepository } from "../../../domain/repositories/refresh-token.repository";
import type { IUserRepository } from "../../../domain/repositories/user.repository";
import { appConfig } from "../../../config/app.config";

// Interface pembantu untuk tipe JWT
interface JwtSigner {
  sign: (payload: any) => Promise<string>;
  verify: (token: string) => Promise<any>;
}

interface RefreshAccessTokenInput {
  refreshToken: string;
  accessJwt: JwtSigner;
  refreshJwt: JwtSigner;
}

export class RefreshAccessTokenUseCase {
  constructor(
    private userRepo: IUserRepository,
    private refreshTokenRepo: IRefreshTokenRepository
  ) {}

  async execute({ refreshToken, accessJwt, refreshJwt }: RefreshAccessTokenInput) {
    // 1. Verifikasi refresh token JWT signature dan expiration
    const payload = await refreshJwt.verify(refreshToken);
    if (!payload || !payload.id) {
      throw new Error("Refresh token tidak valid atau telah kadaluarsa.");
    }

    // 2. Cek apakah refresh token ada di database dan belum kadaluarsa
    const storedRefreshToken = await this.refreshTokenRepo.findByToken(refreshToken);
    if (!storedRefreshToken || storedRefreshToken.expiresAt < new Date()) {
      // Jika token ditemukan tapi sudah kadaluarsa, hapus dari DB
      if (storedRefreshToken) {
        await this.refreshTokenRepo.delete(storedRefreshToken.id);
      }
      throw new Error("Refresh token tidak ditemukan atau telah kadaluarsa di database.");
    }

    // 3. Ambil data user untuk membuat payload access token baru
    const user = await this.userRepo.findById(storedRefreshToken.userId);
    if (!user) {
      // Jika user tidak ditemukan, cabut refresh token untuk keamanan
      await this.refreshTokenRepo.delete(storedRefreshToken.id);
      throw new Error("Pengguna tidak ditemukan.");
    }

    // 4. Buat payload user untuk access token baru
    const userPayload = {
      id: user.id as string,
      username: user.username as string,
      name: user.name || "",
      roles: user.roles?.map((ur: any) => ur.role?.name).filter(Boolean) || [],
      roleIds: user.roles?.map((ur: any) => ur.role?.id) || [],
      permissions: [
        ...new Set(
          user.roles?.flatMap(
            (ur: any) =>
              ur.role?.permissions?.map((rp: any) => rp.permission.name) || [],
          ) || [],
        ),
      ] as string[],
      permissionIds: [
        ...new Set(
          user.roles?.flatMap(
            (ur: any) =>
              ur.role?.permissions?.map((rp: any) => rp.permission.id) || [],
          ) || [],
        ),
      ] as string[],
    };

    // 5. Generate access token baru
    const newAccessToken = await accessJwt.sign(userPayload as any);
    const newRefreshToken = await refreshJwt.sign({ id: userPayload.id } as any);

    // 6. Simpan token baru ke DB & Hapus yang lama (Rotation)
    const refreshTokenExpiresAt = new Date(Date.now() + (appConfig.jwt.refreshMaxAge * 1000));
    await this.refreshTokenRepo.create(user.id, newRefreshToken, refreshTokenExpiresAt);
    await this.refreshTokenRepo.delete(storedRefreshToken.id);

    return { newAccessToken, newRefreshToken, userPayload };
  }
}