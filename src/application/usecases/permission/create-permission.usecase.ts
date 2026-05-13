import Joi from "joi";
import type { IPermissionRepository } from "../../../domain/repositories/permission.repository";

const createPermissionSchema = Joi.object({
  name: Joi.string().min(3).required().messages({
    "string.empty": "Nama permission tidak boleh kosong.",
    "string.min": "Nama permission minimal 3 karakter.",
    "any.required": "Nama permission wajib diisi."
  }),
  description: Joi.string().optional().allow("")
});

export class CreatePermissionUseCase {
  constructor(private permissionRepo: IPermissionRepository) {}

  async execute(data: { name: string; description?: string }) {
    // 1. Validasi Joi
    const { error, value } = createPermissionSchema.validate(data, {
      abortEarly: false,
      stripUnknown: true
    });

    // PERBAIKAN: Gunakan Optional Chaining dan Nullish Coalescing untuk menghindari 'undefined'
    if (error) {
      const errorMessage = error.details?.[0]?.message ?? "Validasi gagal.";
      throw new Error(errorMessage);
    }

    // 2. Format Name & Cek Duplikasi
    // Gunakan 'value' hasil validasi agar lebih aman
    const formattedName = value.name.toUpperCase().replace(/\s+/g, '_');

    const allPermissions = await this.permissionRepo.findAll();
    const isExist = allPermissions.find(p => p.name === formattedName);
    
    if (isExist) {
      throw new Error(`Nama permission '${formattedName}' sudah ada.`);
    }

    return await this.permissionRepo.create(formattedName, value.description);
  }
}