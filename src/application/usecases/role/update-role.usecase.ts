import Joi from "joi";
import type { IRoleRepository } from "../../../domain/repositories/role.repository";

// Validasi input untuk update role
const updateRoleSchema = Joi.object({
  name: Joi.string().min(1).optional().messages({
    "string.empty": "Nama role tidak boleh kosong, tolong diisi.",
    "string.min": "Nama role minimal 1 karakter."
  }),
  description: Joi.string().min(1).optional().messages({
    "string.empty": "Deskripsi tidak boleh kosong, tolong diisi.",
    "string.min": "Deskripsi minimal 1 karakter."
  }),
  permissionIds: Joi.array()
    .items(
      Joi.string().uuid().messages({
        "string.uuid": "ID Permission '{#value}' tidak valid. Pastikan format UUID benar.",
        "string.guid": "ID Permission '{#value}' bukan format UUID yang benar."
      })
    )
    .optional()
    .messages({
      "array.base": "permissionIds harus berupa array."
    })
});

// 1. Definisikan Interface
interface UpdateRoleInput {
  name?: string;
  description?: string;
  permissionIds?: string[];
}

export class UpdateRoleUseCase {
  constructor(private roleRepo: IRoleRepository) {}

  async execute(id: string, data: UpdateRoleInput) {
    // 2. Jalankan validasi
    const { error, value } = updateRoleSchema.validate(data, { 
      abortEarly: false,
      stripUnknown: true // Menghapus field yang tidak ada di skema (sangat aman)
    });
    // Gunakan Optional Chaining (?.) dan default value
    if (error) {
      const errorMessage = error.details?.[0]?.message ?? "Validasi gagal";
      throw new Error(errorMessage);
    }

    // 3. Casting 'value' ke 'UpdateRoleInput' agar TypeScript tenang
    const validatedData = value as UpdateRoleInput;
    
    // 4. Cek apakah role yang mau diupdate ada
    const existing = await this.roleRepo.findById(id);
    if (!existing) throw new Error("Role tidak ditemukan");

    // 5. Transformasi nama jika ada
    // Jika ada perubahan nama, cek duplikasi dan transformasi ke format yang diinginkan
    if (validatedData.name) {
      // Normalisasi nama (Uppercase & Underscore)
      const formattedName = validatedData.name.toUpperCase().replace(/\s+/g, '_');
      
      // CARI apakah ada Role LAIN yang sudah pakai nama ini
      const roles = await this.roleRepo.findAll();
      const isNameTaken = roles.find(r => r.name === formattedName && r.id !== id);
      
      if (isNameTaken) {
        throw new Error(`Nama role '${formattedName}' sudah terdaftar, gunakan nama lain.`);
      }

      validatedData.name = formattedName;
    }
    try {
    // 5. Kirim data yang sudah divalidasi ke repository
    return await this.roleRepo.update(id, validatedData);
    } catch (dbError: any) {
      // Backup jika pengecekan di atas lolos tapi database tetap menolak
      if (dbError.message?.includes("Unique constraint failed")) {
        throw new Error("Nama role ini sudah digunakan oleh data lain.");
      }
      throw dbError;
    }
  }
}