import Joi from "joi";
import { unlink } from "node:fs/promises";
import type { IUserRepository } from "../../../domain/repositories/user.repository";
import { userSchemas } from "../../../domain/validators/user.validator";

export class UpdateUserUseCase {
  constructor(private userRepo: IUserRepository) {}

  async execute(id: string, input: any) {
    // 0. Ekstraksi File Foto (Elysia mengirim t.File sebagai Blob/File object)
    // Kita ambil filenya dan hapus dari input agar tidak bentrok dengan validasi Joi string
    const photoFile = input.photo instanceof Blob ? input.photo : null;
    if (photoFile) {
      delete input.photo;
    }

    // 1. Validasi input menggunakan validator pusat
    const { error, value } = userSchemas.update.validate(input, {
      stripUnknown: true, // Hapus field ilegal yang tidak ada di schema
      abortEarly: true,
    });
    if (error) {
      throw new Error(error.details?.[0]?.message ?? "Validasi gagal");
    }

    // 2. LOGIKA TAMBAHAN: Hapus field yang isinya string kosong atau null
    // agar tidak menimpa data lama di database dengan data kosong
    Object.keys(value).forEach((key) => {
      if (value[key] === "" || value[key] === null) {
        delete value[key];
      }
    });

    // Jika tidak ada data teks dan tidak ada upload foto
    if (Object.keys(value).length === 0 && !photoFile) {
      throw new Error("Tidak ada data valid yang dikirim untuk diperbarui.");
    }

    // 3. Cek apakah user ada
    const existingUser = await this.userRepo.findById(id);
    if (!existingUser) throw new Error("User tidak ditemukan");

    // 4. PROSES UPLOAD FOTO (Jika ada file yang diunggah)
    let newSavedPath: string | null = null;
    if (photoFile) {
      // Pemetaan MIME Type ke ekstensi untuk mencegah manipulasi
      const mimeMap: Record<string, string> = {
        'image/jpeg': 'jpg',
        'image/png': 'png'
      };
      
      const fileExt = mimeMap[photoFile.type] || 'jpg';
      const fileName = `user-${id}-${Date.now()}.${fileExt}`;
      const relativePath = `public/uploads/users/${fileName}`;
      newSavedPath = relativePath;

      // Simpan file menggunakan Bun.write
      await Bun.write(relativePath, photoFile);

      // Masukkan path baru ke dalam data yang akan diupdate ke DB
      value.photo = `/${relativePath}`;
    }

    // 4. Cek keunikan email jika email ikut diubah
    if (value.email && value.email !== existingUser.email) {
      const emailOccupied = await this.userRepo.findByEmail(value.email);
      if (emailOccupied)
        throw new Error("Email sudah digunakan oleh user lain");
    }

    // 5. Cek keunikan username jika username ikut diubah
    if (value.username && value.username !== existingUser.username) {
      const usernameOccupied = await this.userRepo.findByUsername(
        value.username,
      );
      if (usernameOccupied)
        throw new Error("Username sudah digunakan oleh user lain");
    }

    // 6. Enkripsi password baru jika password dikirim untuk di-update
    if (value.password) {
      value.password = await Bun.password.hash(value.password, {
        algorithm: "bcrypt",
        cost: 10,
      });
    }

    try {
      const updatedUser = await this.userRepo.update(id, value);

      // Jika update sukses DAN ada foto baru, baru hapus foto lama
      if (photoFile && existingUser.photo && existingUser.photo.startsWith('/public/uploads/users/')) {
        try {
          await unlink(existingUser.photo.substring(1));
        } catch (err) {
          console.error("Gagal menghapus foto lama:", err);
        }
      }

      return updatedUser;
    } catch (error) {
      // Jika DB gagal, hapus file BARU yang sudah terlanjur diupload
      if (newSavedPath) {
        await unlink(newSavedPath).catch(() => {});
      }
      throw error;
    }
  }
}
