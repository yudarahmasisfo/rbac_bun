import Joi from "joi";
import type { IRoleRepository } from "../../../domain/repositories/role.repository";

export const createRoleSchema = Joi.object({
  name: Joi.string().min(3).required().uppercase(),
  description: Joi.string().allow(''),
  permissionIds: Joi.array().items(Joi.string().uuid()).min(1).required()
});

export class CreateRoleUseCase {
  constructor(private roleRepo: IRoleRepository) {}

  async execute(input: any) {
    // Validasi Joi
    const { error, value } = createRoleSchema.validate(input);
    if (error) {
      throw new Error(error.details?.[0]?.message ?? "Validasi gagal");
    }

    // Cek apakah Role sudah ada
    const roles = await this.roleRepo.findAll();
    if (roles.some(r => r.name === value.name)) {
      throw new Error("Role name already exists");
    }

    return await this.roleRepo.create(value.name, value.description, value.permissionIds);
  }
}