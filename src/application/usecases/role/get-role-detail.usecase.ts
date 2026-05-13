import type { IRoleRepository } from "../../../domain/repositories/role.repository";

export class GetRoleDetailUseCase {
  constructor(private roleRepo: IRoleRepository) {}

  async execute(id: string) {
    // 1. Cari data role lengkap dengan permissions-nya melalui repository
    const role = await this.roleRepo.findById(id);

    // 2. Validasi keberadaan data
    if (!role) {
      throw new Error("ID Role tidak ditemukan, data tidak tersedia.");
    }

    return role;
  }
}