import type { IPermissionRepository } from "../../../domain/repositories/permission.repository";

export class DeletePermissionUseCase {
  constructor(private permissionRepo: IPermissionRepository) {}

  async execute(id: string) {
    const existing = await this.permissionRepo.findById(id);
    if (!existing) {
      throw new Error("ID Permission tidak ditemukan, gagal menghapus.");
    }

    return await this.permissionRepo.delete(id);
  }
}