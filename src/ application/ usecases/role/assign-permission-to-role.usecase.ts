import Joi from "joi";
import type { IRoleRepository } from "../../../ domain/ repositories/role.repository";

// Validasi input agar permissionIds harus berupa Array of String (UUID)
export const assignPermissionSchema = Joi.object({
  permissionIds: Joi.array().items(Joi.string().uuid()).min(1).required().messages({
    "array.min": "Minimal harus pilih satu permission untuk role ini",
    "string.uuid": "ID Permission harus berupa UUID yang valid"
  })
});

export class AssignPermissionToRoleUseCase {
  constructor(private roleRepo: IRoleRepository) {}

  async execute(roleId: string, input: any) {
    // 1. Validasi input
    const { error, value } = assignPermissionSchema.validate(input);
    if (error) throw new Error(error.details?.[0]?.message ?? "Validasi gagal");

    // 2. Cek apakah role tersebut ada di database
    const role = await this.roleRepo.findById(roleId);
    if (!role) throw new Error("Role tidak ditemukan");

    // 3. Panggil repository untuk mengupdate relasi permissions
    // Kita gunakan data.permissionIds agar sinkron dengan struktur di repository
    return await this.roleRepo.update(roleId, { 
      permissionIds: value.permissionIds 
    });
  }
}