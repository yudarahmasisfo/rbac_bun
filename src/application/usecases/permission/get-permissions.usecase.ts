import type { IPermissionRepository } from "../../../domain/repositories/permission.repository";

// Use Case untuk mendapatkan semua permissions
export class GetPermissionsUseCase {
  constructor(private permissionRepo: IPermissionRepository) {}

  async execute() {
    return await this.permissionRepo.findAll();
  }
}

// Use Case untuk mendapatkan detail permission berdasarkan ID
export class GetPermissionDetailUseCase {
  constructor(private permissionRepo: IPermissionRepository) {}

  async execute(id: string) {
    // 1. Cari data berdasarkan UUID
    const permission = await this.permissionRepo.findById(id);

    // 2. Jika tidak ditemukan, lempar error dengan pesan Bahasa Indonesia
    if (!permission) {
      throw new Error("ID Permission tidak ditemukan, data tidak tersedia.");
    }

    return permission;
  }
}