import Joi from "joi";
import type { IUserRepository } from "../../../ domain/ repositories/user.repository";

export const updateUserSchema = Joi.object({
 username: Joi.string()
    .alphanum()
    .min(3)
    .max(30)
    .optional()
    .messages({
      "string.pattern.base": "Username hanya boleh berisi huruf, angka, dan spasi"
    }),
  name: Joi.string()
        .pattern(/^[a-zA-Z0-9 ]+$/) // Nama Lengkap boleh pakai spasi
        .min(3)
        .max(50)
        .required()
        .messages({
          "string.pattern.base": "Nama lengkap hanya boleh berisi huruf dan spasi"
        }),   
  email: Joi.string().email().optional(),
  password: Joi.string().min(8).optional(),
  roleIds: Joi.array().items(Joi.string().uuid()).min(1).optional()
});

export class UpdateUserUseCase {
  constructor(private userRepo: IUserRepository) {}

  async execute(id: string, input: any) {
    // 1. Validasi input
    const { error, value } = updateUserSchema.validate(input);
    if (error) {
      throw new Error(error.details?.[0]?.message ?? "Validasi gagal");
    }
    // 2. Cek apakah user ada
    const existingUser = await this.userRepo.findById(id);
    if (!existingUser) throw new Error("User tidak ditemukan");

    // 3. Cek keunikan email jika email ikut diubah
    if (value.email && value.email !== existingUser.email) {
      const emailOccupied = await this.userRepo.findByEmail(value.email);
      if (emailOccupied) throw new Error("Email sudah digunakan oleh user lain");
    }

    // 4. Cek keunikan username jika username ikut diubah
    if (value.username && value.username !== existingUser.username) {
      const usernameOccupied = await this.userRepo.findByUsername(value.username);
      if (usernameOccupied) throw new Error("Username sudah digunakan oleh user lain");
    }

    // 5. Enkripsi password baru jika password dikirim untuk di-update
    if (value.password) {
      value.password = await Bun.password.hash(value.password, {
        algorithm: "bcrypt",
        cost: 10
      });
    }

    return await this.userRepo.update(id, value);
  }
}