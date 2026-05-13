import type { IUserRepository } from "../../../domain/repositories/user.repository";

export class DeleteUserUseCase {
  constructor(private userRepo: IUserRepository) {}

  async execute(id: string) {
    // 1. Cek apakah user ada sebelum dihapus
    const existingUser = await this.userRepo.findById(id);
    
    if (!existingUser) {
      throw new Error("User tidak ditemukan atau sudah dihapus");
    }

    // 2. Eksekusi penghapusan di repository
    return await this.userRepo.delete(id);
  }
}