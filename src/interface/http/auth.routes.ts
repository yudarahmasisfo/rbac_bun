import { Elysia, t } from "elysia";
import { jwt } from "@elysiajs/jwt";
import { rateLimit } from 'elysia-rate-limit';
import { PrismaUserRepository } from "../../infrastructure/repositories/prisma-user.repository";
import { LoginUseCase } from "../../application/usecases/auth/login.usecase";

const userRepo = new PrismaUserRepository();
const loginUseCase = new LoginUseCase(userRepo);

export const authRoutes = new Elysia({ prefix: '/auth' })
  // --- LAPIS 2: SPECIFIC RATE LIMIT (LOGIN) ---
  .use(
    rateLimit({
      max: 5, // Sangat ketat: hanya 5 kali percobaan
      duration: 60000, // 1 menit (dalam milidetik)
      generator: (request) => request.headers.get('x-forwarded-for') || 'global',
      errorResponse: new Response(JSON.stringify({
        success: false,
        error: "Terlalu banyak percobaan login. Akun Anda aman, silakan coba lagi dalam 1 menit."
      }), { status: 429, headers: { 'Content-Type': 'application/json' } })
    })
  )
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
    // 1. Jalankan logika login
    const userPayload = await loginUseCase.execute(body);

    // 2. Generate Token JWT
    const token = await jwt.sign(userPayload as any); // Cast ke any karena payload bisa berisi data custom       

    // 3. Kembalikan token dan data user (tanpa password) ke client
    return {
      success: true,
      message: "Login berhasil",
      accessToken: token,
      user: userPayload
    };
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