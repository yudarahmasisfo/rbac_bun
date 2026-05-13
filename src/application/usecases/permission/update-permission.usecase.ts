import Joi from "joi";
import type { IPermissionRepository } from "../../../domain/repositories/permission.repository";

const updatePermissionSchema = Joi.object({
  name: Joi.string().min(3).optional().messages({
    "string.empty": "Nama permission tidak boleh kosong.",
    "string.min": "Nama permission minimal 3 karakter."
  }),
  description: Joi.string().optional().allow("")
});

export class UpdatePermissionUseCase {
  constructor(private permissionRepo: IPermissionRepository) {}

  async execute(id: string, data: any) {
    // 1. Validasi Joi
    const { error, value } = updatePermissionSchema.validate(data);
    if (error) throw new Error(error.details?.[0]?.message ?? "Validasi gagal.");

    // 2. Cek apakah UUID ditemukan
    const existing = await this.permissionRepo.findById(id);
    if (!existing) throw new Error("ID Permission tidak ditemukan.");

    // 3. Cek Duplikasi jika nama diubah
    if (value.name) {
      const formattedName = value.name.toUpperCase().replace(/\s+/g, '_');
      const all = await this.permissionRepo.findAll();
      const isTaken = all.find(p => p.name === formattedName && p.id !== id);
      if (isTaken) throw new Error(`Nama permission '${formattedName}' sudah digunakan.`);
      value.name = formattedName;
    }

    return await this.permissionRepo.update(id, value);
  }
}