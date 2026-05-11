import Joi from "joi";
import type { IRoleRepository } from "../../../ domain/ repositories/role.repository";

// Validasi input agar permissionIds harus berupa Array of String (UUID)
// 1. Definisikan Skema dengan pesan Bahasa Indonesia yang lebih lengkap
export const assignPermissionSchema = Joi.object({
  permissionIds: Joi.array()
    .items(
      Joi.string().uuid().messages({
        "string.uuid": "ID Permission '{#value}' tidak valid. Pastikan format UUID benar.",
        "string.base": "ID Permission harus berupa teks."
      })
    )
    .min(1)
    .required()
    .messages({
      "array.min": "Minimal harus pilih satu permission untuk role ini.",
      "array.base": "permissionIds harus berupa array.",
      "any.required": "permissionIds wajib diisi."
    })
});

export class AssignPermissionToRoleUseCase {
  constructor(private roleRepo: IRoleRepository) {}

  async execute(roleId: string, input: any) {
    // 2. Validasi input dengan opsi abortEarly: false agar mengecek semua ID
    const { error, value } = assignPermissionSchema.validate(input, {
      abortEarly: false,
      errors: {
        label: 'key'
      }
    });

    if (error) {
      // Ambil detail error pertama
      // PERBAIKAN: Gunakan Optional Chaining dan Nullish Coalescing
      const detail = error.details?.[0];  
      if (!detail) {
        throw new Error("Validasi gagal tanpa detail spesifik.");
      }
      let customMessage = detail.message;

      // Terjemahan logika tambahan jika diperlukan (opsional karena sudah ada di .messages())
      if (detail.type === 'string.uuid') {
        const pathName = detail.path.join('.');
        customMessage = `Format ID pada ${pathName} salah. Cek kembali data: ${detail.context?.value}`;
      }

      throw new Error(customMessage);
    }

    // 3. Cek apakah role tersebut ada di database (Sangat penting untuk stabilitas)
    const role = await this.roleRepo.findById(roleId);
    if (!role) {
      throw new Error("Role tidak ditemukan, gagal memperbarui permission.");
    }

    // 4. Panggil repository (Data sudah divalidasi oleh Joi, jadi aman)
    try {
      return await this.roleRepo.update(roleId, { 
        permissionIds: value.permissionIds 
      });
    } catch (dbError: any) {
      // Menangkap error jika ID Permission valid secara format (UUID) tapi tidak ada di tabel Permission
      if (dbError.message.includes("nested connect")) {
        throw new Error("Salah satu ID Permission tidak terdaftar di sistem. Cek kembali list permission Anda.");
      }
      throw dbError;
    }
  }
}