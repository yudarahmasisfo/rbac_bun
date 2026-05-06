import type { IPermissionRepository } from "../../../ domain/ repositories/permission.repository";

export class CreatePermissionUseCase {
  constructor(private permissionRepo: IPermissionRepository) {}

  async execute(name: string, description?: string) {
    // Tambahkan Logika Bisnis di sini:
    // Misalnya, mengubah nama menjadi UPPERCASE otomatis sesuai standar enterprise
    const formattedName = name.toUpperCase().replace(/\s+/g, '_');
    
    return await this.permissionRepo.create(formattedName, description);
  }
}