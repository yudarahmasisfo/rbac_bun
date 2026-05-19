import type { IUserRepository } from "../../../domain/repositories/user.repository";

export class ActivateUserUseCase {
  constructor(private userRepo: IUserRepository) {}

  async execute(id: string) {
    // 1. Cek keberadaan user
    const user = await this.userRepo.findById(id);
    if (!user) throw new Error("User tidak ditemukan.");
    
    // 2. Cek apakah sudah aktif
    if (user.isActive) {
      throw new Error("Akun user tersebut sudah dalam status aktif.");
    }

    // 3. Update status
    return await this.userRepo.update(id, { isActive: true });
  }
}