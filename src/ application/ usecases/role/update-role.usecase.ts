import type { IRoleRepository } from "../../../ domain/ repositories/role.repository";

export class UpdateRoleUseCase {
  constructor(private roleRepo: IRoleRepository) {}

  async execute(id: string, data: { name?: string; description?: string; permissionIds?: string[] }) {
    const existing = await this.roleRepo.findById(id);
    if (!existing) throw new Error("Role tidak ditemukan");

    if (data.name) {
      data.name = data.name.toUpperCase().replace(/\s+/g, '_');
    }

    return await this.roleRepo.update(id, data);
  }
}