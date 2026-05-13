import Joi from "joi";
import type { IUserRepository } from "../../../domain/repositories/user.repository";
import { userSchemas } from "../../../domain/validators/user.validator";



export class RegisterUserUseCase {
  constructor(private userRepo: IUserRepository) {}

  async execute(input: any) {
    // 1. Validasi input dengan Joi
    // 1. Validasi dengan Joi (Clean & Safe)
    const { error, value } = userSchemas.register.validate(input, { 
      abortEarly: false, 
      stripUnknown: true 
    });

    if (error) {
      throw new Error(error.details?.[0]?.message ?? "Validasi gagal");
    }

    // 2. Cek keunikan email
    // 2. Business Logic (Check Uniqueness)
    if (await this.userRepo.findByEmail(value.email)) throw new Error("Email sudah terdaftar");
    if (await this.userRepo.findByUsername(value.username)) throw new Error("Username sudah digunakan");

    // 3. Enkripsi Password menggunakan Bun.password secara aman
    // 3. Hash Password
    value.password = await Bun.password.hash(value.password, {
      algorithm: "bcrypt",
      cost: 10
    });

    return await this.userRepo.create(value);
  }
}