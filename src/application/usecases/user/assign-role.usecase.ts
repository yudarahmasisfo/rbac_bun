import Joi from "joi";
import type { IUserRepository } from "../../../domain/repositories/user.repository";

export const assignRoleSchema = Joi.object({
  roleIds: Joi.array().items(Joi.string().uuid()).min(1).required().messages({
    "array.min": "Minimal harus pilih satu role untuk user ini",
    "string.uuid": "ID Role harus berupa UUID yang valid"
  })
});

export class AssignRoleUseCase {
  constructor(private userRepo: IUserRepository) {}

  async execute(userId: string, input: any) {
    // 1. Validasi input array roleIds
    const { error, value } = assignRoleSchema.validate(input);
    if (error) throw new Error(error.details?.[0]?.message ?? "Validasi gagal");

    // 2. Cek apakah user ada
    const user = await this.userRepo.findById(userId);
    if (!user) throw new Error("User tidak ditemukan");

    // 3. Update hanya bagian roles-nya saja
    return await this.userRepo.update(userId, { roleIds: value.roleIds });
  }
}