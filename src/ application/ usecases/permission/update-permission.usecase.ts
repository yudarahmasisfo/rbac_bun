import type { IPermissionRepository } from "../../../domain/repositories/permission.repository";

export class UpdatePermissionUseCase {
  constructor(private permissionRepo: IPermissionRepository) {}

  async execute(id: string, data: { name?: string; description?: string }) {
    // Validasi: Cek apakah data ada sebelum di-update
    const existing = await this.permissionRepo.findById(id);
    if (!existing) {
      throw new Error("Permission tidak ditemukan");
    }

    // Jika nama diubah, format ulang ke UPPERCASE
    if (data.name) {
      data.name = data.name.toUpperCase().replace(/\s+/g, '_');
    }

    return await this.permissionRepo.update(id, data);
  }
}