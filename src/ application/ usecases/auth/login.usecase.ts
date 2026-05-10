import Joi from "joi";
import type { IUserRepository } from "../../../ domain/ repositories/user.repository";

export const loginSchema = Joi.object({
  username: Joi.string().required(),
  password: Joi.string().required()
});

export class LoginUseCase {
  constructor(private userRepo: IUserRepository) {}

  async execute(input: any) {
    // 1. Validasi input
    const { error, value } = loginSchema.validate(input);
    if (error) throw new Error("Username dan password wajib diisi");

    // 2. Cari user berdasarkan username
    // Kita butuh data user lengkap dengan Role dan Permission-nya
    const user = await this.userRepo.findByUsername(value.username) as any;
    if (!user) throw new Error("Kredensial tidak valid");

    // 3. Verifikasi password menggunakan Bun.password
    const isPasswordValid = await Bun.password.verify(value.password, user.password);
    if (!isPasswordValid) throw new Error("Kredensial tidak valid");

    // 4. Siapkan data untuk JWT (Payload)
    // Kita ambil semua nama permission dari semua role yang dimiliki user
   // Gunakan Optional Chaining (?.) untuk keamanan ekstra jika roles kosong
    const permissions: string[] = user.roles?.flatMap((ur: any) => 
      ur.role?.permissions?.map((rp: any) => rp.permission?.name) || []
    ) || [];

    // Hilangkan duplikasi permission
    const uniquePermissions = [...new Set(permissions)];

    return {
      id: user.id as string,
      username: user.username as string,
      name: (user.name as string) || "",
      permissions: uniquePermissions as string[]
    };
  }
}