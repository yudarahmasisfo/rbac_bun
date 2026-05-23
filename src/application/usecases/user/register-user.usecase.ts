import Joi from "joi";
import { unlink } from "node:fs/promises";
import type { IUserRepository } from "../../../domain/repositories/user.repository";
import { userSchemas } from "../../../domain/validators/user.validator";



export class RegisterUserUseCase {
  constructor(private userRepo: IUserRepository) {}

  async execute(input: any) {
    // 0. Ekstraksi File Foto (Blob)
    // Kita ambil filenya dan hapus dari input agar tidak bentrok dengan validasi Joi
    const photoFile = input.photo instanceof Blob ? input.photo : null;
    if (photoFile) {
      // Validasi tambahan di level Use Case (Opsional, karena sudah ada di Route)
      if (photoFile.size > 2 * 1024 * 1024) throw new Error("Ukuran foto maksimal 2MB");
      if (!['image/jpeg', 'image/png'].includes(photoFile.type)) {
        throw new Error("Format foto harus JPG atau PNG");
      }
      delete input.photo;
    }

    // 1. Validasi input dengan Joi (Data teks)
    const { error, value } = userSchemas.register.validate(input, { 
      abortEarly: false, 
      stripUnknown: true 
    });
    if (error) {
      throw new Error(error.details?.[0]?.message ?? "Validasi gagal");
    }

    // 2. Business Logic (Cek Email & Username)
    if (await this.userRepo.findByEmail(value.email)) 
      throw new Error("Email sudah terdaftar");
    if (await this.userRepo.findByUsername(value.username)) 
      throw new Error("Username sudah digunakan");

    // 3. PROSES UPLOAD FOTO (Jika ada file yang diunggah)
    let savedPath: string | null = null;
    if (photoFile) {
      const mimeMap: Record<string, string> = {
        'image/jpeg': 'jpg',
        'image/png': 'png'
      };
      
      const fileExt = mimeMap[photoFile.type] || 'jpg';
      // Karena user belum punya ID, kita gunakan username + timestamp untuk nama file
      const fileName = `user-${value.username}-${Date.now()}.${fileExt}`;
      const relativePath = `public/uploads/users/${fileName}`;
      savedPath = relativePath;

      // Simpan file secara fisik
      await Bun.write(relativePath, photoFile);

      // Masukkan path file ke data yang akan dikirim ke Repository
      value.photo = `/${relativePath}`;
    }

    // 4. Hash Password
    value.password = await Bun.password.hash(value.password, {
      algorithm: "bcrypt",
      cost: 10
    });

    try {
      return await this.userRepo.create(value);
    } catch (error) {
      // Jika DB gagal, hapus file yang sudah diupload
      if (savedPath) {
        await unlink(savedPath).catch(() => {});
      }
      throw error;
    }
  }
}