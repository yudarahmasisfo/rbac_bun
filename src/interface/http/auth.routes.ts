import { Elysia, t } from "elysia";
import { jwt } from "@elysiajs/jwt";
import { PrismaUserRepository } from "../../infrastructure/repositories/prisma-user.repository";
import { LoginUseCase } from "../../application/usecases/auth/login.usecase";

const userRepo = new PrismaUserRepository();
const loginUseCase = new LoginUseCase(userRepo);

export const authRoutes = new Elysia({ prefix: '/auth' })
  // Konfigurasi JWT
  .use(
    jwt({
      name: 'jwt',
      // Mengambil secret dari .env
      secret: process.env.JWT_SECRET || 'fallback', // Ganti dengan string yang sangat kuat di .env
      // Mengambil durasi exp dari .env
      exp: process.env.JWT_EXP || '1d' // Token berlaku selama 7 hari
    })
  )
  .post("/login", async ({ body, jwt, set }) => {
    try {
      // 1. Jalankan logika login
      const userPayload = await loginUseCase.execute(body);

      // 2. Generate Token JWT
      const token = await jwt.sign(userPayload as any); // Cast ke any karena payload bisa berisi data custom       

        // 3. Kembalikan token dan data user (tanpa password) ke client
      return {
        message: "Login berhasil",
        accessToken: token,
        user: userPayload
      };
    } catch (e: any) {
      set.status = 401;
      return { error: e.message };
    }
  }, {
    detail: {
      summary: "Login Pengguna",
      description: "Gunakan kredensial Anda untuk mendapatkan token akses.",
      tags: ["Authentication"]
    },
    body: t.Object({
      username: t.String({ 
        description: "Username yang terdaftar",
        examples: ["admin"] 
      }),
      password: t.String({ 
        description: "Password akun",
        examples: ["password123"]
      })
    })
  });