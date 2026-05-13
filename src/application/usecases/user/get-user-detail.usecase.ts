import type { IUserRepository } from "../../../domain/repositories/user.repository";

export class GetUserDetailUseCase {
  constructor(private userRepo: IUserRepository) {}

  async execute(id: string) {
    // 1. Cari data user melalui repository
    const user = await this.userRepo.findById(id);

    // 2. Validasi jika user tidak ditemukan
    if (!user) {
      throw new Error("ID User tidak ditemukan, data tidak tersedia.");
    }

    return user;
  }
}