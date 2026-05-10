import Joi from "joi";
import type { IUserRepository } from "../../../ domain/ repositories/user.repository";


// Validasi Joi yang sangat ketat untuk registrasi aman
// export const registerUserSchema = Joi.object({
//   username: Joi.string().alphanum().min(3).max(30).required().messages({
//     "string.empty": "Username tidak boleh kosong",
//     "string.min": "Username minimal harus 3 karakter",
//     "string.alphanum": "Username hanya boleh berisi huruf dan angka"
//   }),
//   email: Joi.string().email().required().messages({
//     "string.email": "Format email tidak valid",
//     "string.empty": "Email tidak boleh kosong"
//   }),
//   password: Joi.string().min(8).required().messages({
//     "string.min": "Password minimal harus 8 karakter",
//     "string.empty": "Password tidak boleh kosong"
//   }),
//   roleIds: Joi.array().items(Joi.string().uuid()).min(1).required().messages({
//     "array.min": "User minimal harus memiliki 1 Role",
//     "array.base": "roleIds harus berupa Array of UUID"
//   })
// });

// Validasi Joi yang diperbarui agar mendukung spasi
export const registerUserSchema = Joi.object({
  username: Joi.string()
    // Regex: ^[a-zA-Z0-9 ]+$ berarti:
    // a-z (huruf kecil), A-Z (huruf besar), 0-9 (angka), dan " " (spasi)
    .pattern(/^[a-zA-Z0-9 ]+$/) 
    .min(3)
    .max(30)
    .required()
    .messages({
      "string.empty": "Username tidak boleh kosong",
      "string.min": "Username minimal harus 3 karakter",
      "string.pattern.base": "Username hanya boleh berisi huruf, angka, dan spasi"
    }),
  email: Joi.string().email().required().messages({
    "string.email": "Format email tidak valid",
    "string.empty": "Email tidak boleh kosong"
  }),
  password: Joi.string().min(8).required().messages({
    "string.min": "Password minimal harus 8 karakter",
    "string.empty": "Password tidak boleh kosong"
  }),
  roleIds: Joi.array().items(Joi.string().uuid()).min(1).required().messages({
    "array.min": "User minimal harus memiliki 1 Role",
    "array.base": "roleIds harus berupa Array of UUID"
  })
});

export class RegisterUserUseCase {
  constructor(private userRepo: IUserRepository) {}

  async execute(input: any) {
    // 1. Validasi input dengan Joi
    const { error, value } = registerUserSchema.validate(input);
   if (error) {
      throw new Error(error.details?.[0]?.message ?? "Validasi gagal");
    }

    // 2. Cek keunikan email
    const existingEmail = await this.userRepo.findByEmail(value.email);
    if (existingEmail) throw new Error("Email sudah terdaftar");

    // 3. Cek keunikan username
    const existingUsername = await this.userRepo.findByUsername(value.username);
    if (existingUsername) throw new Error("Username sudah digunakan");

    // 4. Enkripsi Password menggunakan Bun.password secara aman
    value.password = await Bun.password.hash(value.password, {
      algorithm: "bcrypt",
      cost: 10
    });

    return await this.userRepo.create(value);
  }
}