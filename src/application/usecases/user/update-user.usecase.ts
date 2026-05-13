import Joi from "joi";
import type { IUserRepository } from "../../../domain/repositories/user.repository";
import { userSchemas } from "../../../domain/validators/user.validator";

export class UpdateUserUseCase {
  constructor(private userRepo: IUserRepository) {}

  async execute(id: string, input: any) {
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

    // Jika setelah dibersihkan ternyata tidak ada data yang dikirim sama sekali
    if (Object.keys(value).length === 0) {
      throw new Error("Tidak ada data valid yang dikirim untuk diperbarui.");
    }

    // 3. Cek apakah user ada
    const existingUser = await this.userRepo.findById(id);
    if (!existingUser) throw new Error("User tidak ditemukan");

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

    return await this.userRepo.update(id, value);
  }
}
