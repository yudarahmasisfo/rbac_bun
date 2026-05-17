import { Elysia, t } from "elysia";
import { jwt } from "@elysiajs/jwt";
import { rateLimit } from 'elysia-rate-limit';
import { PrismaUserRepository } from "../../infrastructure/repositories/prisma-user.repository";
import { LoginUseCase } from "../../application/usecases/auth/login.usecase";
import { appConfig } from "../../config/app.config";

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
      name: 'accessJwt',
      secret: appConfig.jwt.secret,
      exp: appConfig.jwt.accessExp
    })
  )
  .use(
    jwt({
      name: 'refreshJwt',
      secret: appConfig.jwt.refreshSecret,
      exp: appConfig.jwt.refreshExp
    })
  )
  .post("/login", async ({ body, accessJwt, refreshJwt, cookie: { access_token, refresh_token } }) => {
    // 1. Jalankan logika login
    const userPayload = await loginUseCase.execute(body);

    // 2. Generate Access & Refresh Token
    const accessToken = await accessJwt.sign(userPayload as any);
    const refreshToken = await refreshJwt.sign({ id: userPayload.id } as any);

    // 3. Simpan Access Token di HttpOnly Cookie
    access_token.set({
      value: accessToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax', // Mencegah CSRF
      path: '/',
      maxAge: 15 * 60 // 15 Menit
    });

    // 4. Simpan Refresh Token di HttpOnly Cookie (Strict Security)
    refresh_token.set({
      value: refreshToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/api/v1/auth/refresh', // Hanya dikirim ke route refresh
      maxAge: 7 * 86400 // 7 Hari
    });

    // 5. Kembalikan data user TANPA token di body (Mencegah XSS)
    return {
      success: true,
      message: "Login berhasil",
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
    }),
    cookie: t.Cookie({
      access_token: t.Optional(t.String()),
      refresh_token: t.Optional(t.String())
    })
  })

  // --- POINT 3: REFRESH TOKEN ENDPOINT ---
  .post("/refresh", async ({ refreshJwt, accessJwt, cookie: { refresh_token, access_token }, set }) => {
    const token = refresh_token.value;
    if (!token) {
      set.status = 401;
      return { success: false, error: "Sesi berakhir" };
    }

    const payload = await refreshJwt.verify(token as string);
    if (!payload) {
      set.status = 401;
      return { success: false, error: "Refresh token tidak valid" };
    }

    // Generate access token baru
    const newAccessToken = await accessJwt.sign({ id: (payload as any).id } as any);
    
    access_token.set({
      value: newAccessToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 15 * 60
    });

    return { success: true, message: "Akses diperbarui" };
  }, {
    cookie: t.Cookie({
      access_token: t.Optional(t.String()),
      refresh_token: t.Optional(t.String())
    })
  })

  // --- POINT 4: LOGOUT ---
  .post("/logout", ({ cookie: { access_token, refresh_token } }) => {
    access_token.remove();
    refresh_token.remove();
    return {
      success: true,
      message: "Logout berhasil, sesi telah dihapus"
    };
  }, {
    detail: {
      summary: "Logout Pengguna",
      description: "Menghapus cookie access_token dari browser.",
      tags: ["Authentication"]
    },
    cookie: t.Cookie({
      access_token: t.Optional(t.String()),
      refresh_token: t.Optional(t.String())
    })
  });