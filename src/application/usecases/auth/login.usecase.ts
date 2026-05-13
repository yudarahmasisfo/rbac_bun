import { userSchemas } from "../../../domain/validators/user.validator";
import type { IUserRepository } from "../../../domain/repositories/user.repository";

export class LoginUseCase {
  constructor(private userRepo: IUserRepository) {}

  async execute(input: any) {
    // 1. Validasi format (Joi) - Mengambil pesan dari user.validator.ts
    const { error, value } = userSchemas.login.validate(input);
    // PERBAIKAN: Gunakan Optional Chaining (?.) dan Nullish Coalescing (??) 
    // untuk menghindari error 'Object is possibly undefined'
    if (error) {
      const errorMessage = error.details?.[0]?.message ?? "Validasi gagal";
      throw new Error(errorMessage);
    }
    // 2. Cari user berdasarkan username
    const user = await this.userRepo.findByUsername(value.username) as any;
    if (!user) {
      // Sesuai permintaan: Jika user tidak ada
      throw new Error("Username dan password tidak ditemukan di sistem kami");
    }

    // 3. Verifikasi password menggunakan Bun.password
    const isPasswordValid = await Bun.password.verify(value.password, user.password);
    if (!isPasswordValid) {
      // Sesuai permintaan: Jika password tidak cocok
      throw new Error("Username dan password tidak ditemukan di sistem kami");
    }

    // 4. Ekstraksi Roles & Permissions untuk Payload JWT
    // Mengambil semua nama role
    const roles = user.roles?.map((ur: any) => ur.role?.name) || [];

    // Mengambil semua nama permission dari tiap role, lalu hilangkan duplikasi (Unique)
    const permissions: string[] = [
      ...new Set(
        user.roles?.flatMap((ur: any) => 
          ur.role?.permissions?.map((rp: any) => rp.permission?.name) || []
        ) || []
      ),
    ] as string[];

    // 5. Kembalikan Payload (Tanpa Password)
    // Payload ini yang akan di-sign menjadi Token JWT
    return {
      id: user.id as string,
      username: user.username as string,
      name: user.name || "",
      roles: roles as string[],
      permissions: permissions
    };
  }
}