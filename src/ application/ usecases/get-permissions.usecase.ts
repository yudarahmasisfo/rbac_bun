import type { IPermissionRepository } from "../../ domain/ repositories/permission.repository";
 
export class GetPermissionsUseCase {
  constructor(private permissionRepo: IPermissionRepository) {}

  async execute() {
    return await this.permissionRepo.findAll();
  }
}

export class CreatePermissionUseCase {
  constructor(private permissionRepo: IPermissionRepository) {}

  async execute(name: string, description?: string) {
    // Validasi sederhana: cek apakah nama sudah ada
    const existing = await this.permissionRepo.findAll();
    if (existing.some(p => p.name === name)) {
      throw new Error("Permission name already exists");
    }
    return await this.permissionRepo.create(name, description);
  }
}

export class DeletePermissionUseCase {
  constructor(private permissionRepo: IPermissionRepository) {}

  async execute(id: string) {
    const existing = await this.permissionRepo.findById(id);
    if (!existing) throw new Error("Permission not found");
    
    return await this.permissionRepo.delete(id);
  }
}