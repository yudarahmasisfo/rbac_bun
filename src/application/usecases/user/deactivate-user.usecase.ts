import type { IUserRepository } from "../../../domain/repositories/user.repository";
import type { IRefreshTokenRepository } from "../../../domain/repositories/refresh-token.repository";

export class DeactivateUserUseCase {
  constructor(
    private userRepo: IUserRepository,
    private refreshTokenRepo: IRefreshTokenRepository
  ) {}

  async execute(id: string, adminId?: string) {
    // 1. Cek keberadaan user
    const user = await this.userRepo.findById(id);
    if (!user) throw new Error("User tidak ditemukan.");

    // 2. Proteksi: Mencegah admin menonaktifkan akunnya sendiri (Lockout Protection)
    if (id === adminId) {
      throw new Error("Keamanan: Anda tidak diperbolehkan menonaktifkan akun Anda sendiri.");
    }

    if (user.isActive === false) {
      throw new Error("Akun user tersebut memang sudah tidak aktif.");
    }

    // 3. Update status di database
    const updatedUser = await this.userRepo.update(id, { isActive: false });

    // 4. TINDAKAN KEAMANAN: Hapus semua sesi aktif di database
    // Ini memastikan user tersebut langsung ter-logout dari semua perangkat
    await this.refreshTokenRepo.deleteByUserId(id);

    return updatedUser;
  }
}