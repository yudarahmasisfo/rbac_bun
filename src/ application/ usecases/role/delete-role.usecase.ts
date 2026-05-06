import type { IRoleRepository } from "../../../domain/repositories/role.repository";

export class DeleteRoleUseCase {
  constructor(private roleRepo: IRoleRepository) {}

  async execute(id: string) {
    const existing = await this.roleRepo.findById(id);
    if (!existing) throw new Error("Role tidak ditemukan");

    return await this.roleRepo.delete(id);
  }
}