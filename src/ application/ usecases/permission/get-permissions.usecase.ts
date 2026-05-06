import type { IPermissionRepository } from "../../../ domain/ repositories/permission.repository";

export class GetPermissionsUseCase {
  constructor(private permissionRepo: IPermissionRepository) {}

  async execute() {
    return await this.permissionRepo.findAll();
  }
}