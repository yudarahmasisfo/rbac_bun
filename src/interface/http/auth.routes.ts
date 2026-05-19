import { Elysia, t } from "elysia";
import { jwt } from "@elysiajs/jwt";
import { rateLimit } from 'elysia-rate-limit';
import { PrismaUserRepository } from "../../infrastructure/repositories/prisma-user.repository";
import { LoginUseCase } from "../../application/usecases/auth/login.usecase";
import { PrismaRefreshTokenRepository } from "../../infrastructure/repositories/prisma-refresh-token.repository";
import { GenerateTokensUseCase } from "../../application/usecases/auth/generate-tokens.usecase";
import { RevokeRefreshTokenUseCase } from "../../application/usecases/auth/revoke-refresh-token.usecase";
import { RefreshAccessTokenUseCase } from "../../application/usecases/auth/refresh-access-token.usecase";
import { rbacPlugin } from "../middleware/rbac.plugin";
import { appConfig } from "../../config/app.config";

const userRepo = new PrismaUserRepository();
const refreshTokenRepo = new PrismaRefreshTokenRepository();
const loginUseCase = new LoginUseCase(userRepo);
const generateTokensUseCase = new GenerateTokensUseCase(refreshTokenRepo);
const revokeRefreshTokenUseCase = new RevokeRefreshTokenUseCase(refreshTokenRepo);
const refreshAccessTokenUseCase = new RefreshAccessTokenUseCase(userRepo, refreshTokenRepo);

export const authRoutes = new Elysia({ prefix: '/auth' })
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
  // --- GRUP LOGIN: RATE LIMIT KETAT ---
  .group('', (app) => app
    .use(
      rateLimit({
        max: 20,
        duration: 60000,
        generator: (request) => request.headers.get('x-real-ip') || request.headers.get('x-forwarded-for')?.split(',')[0] || 'login-global',
        errorResponse: new Response(JSON.stringify({
          success: false,
          error: "Terlalu banyak percobaan login. Akun Anda aman, silakan coba lagi dalam 1 menit."
        }), { status: 429, headers: { 'Content-Type': 'application/json' } })
      })
    )
    .post("/login", async ({ body, accessJwt, refreshJwt, cookie: { access_token, refresh_token } }) => {
      // 1. Jalankan logika login
      const userPayload = await loginUseCase.execute(body);

      // 2. Generate Access & Refresh Token (OTOMATIS SIMPAN KE DATABASE)
      const { accessToken, refreshToken } = await generateTokensUseCase.execute({ 
        userPayload: userPayload as any, 
        accessJwt: accessJwt as any, 
        refreshJwt: refreshJwt as any 
      });

      // 3. Simpan Access Token di HttpOnly Cookie
      access_token.set({
        value: accessToken,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: appConfig.jwt.accessMaxAge
      });

      // 4. Simpan Refresh Token di HttpOnly Cookie (Strict Security)
      refresh_token.set({
        value: refreshToken,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/',
        maxAge: appConfig.jwt.refreshMaxAge
      });

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
        username: t.String({ description: "Username yang terdaftar", examples: ["admin"] }),
        password: t.String({ description: "Password akun", examples: ["password123"] })
      }),
      cookie: t.Cookie({
        access_token: t.Optional(t.String()),
        refresh_token: t.Optional(t.String())
      })
    })
  )

  // --- GRUP PROTECTED: RATE LIMIT LONGGAR ---
  .group('', (app) => app
    .use(
      rateLimit({
        max: 50,
        duration: 60000,
        generator: (request) => {
          const ip = request.headers.get('x-real-ip') || 'auth-user';
          return `rate-limit-auth-${ip}`;
        },
        errorResponse: new Response(JSON.stringify({
          success: false,
          error: "Aktivitas sesi terlalu padat. Tunggu sebentar."
        }), { status: 429, headers: { 'Content-Type': 'application/json' } })
      })
    )
  .post("/refresh", async ({ refreshJwt, accessJwt, cookie: { refresh_token, access_token }, set }) => {
    const currentRefreshToken = refresh_token.value;
    if (!currentRefreshToken) {
      set.status = 401;
      return { success: false, error: "Sesi berakhir" };
    }

    try {
      // Gunakan UseCase untuk verifikasi JWT sekaligus validasi di database
      const { newAccessToken, newRefreshToken, userPayload } = await refreshAccessTokenUseCase.execute({
        refreshToken: currentRefreshToken as string,
        accessJwt: accessJwt as any,
        refreshJwt: refreshJwt as any,
      });

      access_token.set({
        value: newAccessToken,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/', 
        maxAge: appConfig.jwt.accessMaxAge
      });

      // Update Refresh Token (Rotation)
      refresh_token.set({
        value: newRefreshToken,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/',
        maxAge: appConfig.jwt.refreshMaxAge
      });

      return { success: true, message: "Akses diperbarui", user: userPayload };
    } catch (error: any) {
      set.status = 401;
      return { success: false, error: error.message };
    }
  }, {
    cookie: t.Cookie({
      access_token: t.Optional(t.String()),
      refresh_token: t.Optional(t.String())
    })
  })

  // --- POINT 4: LOGOUT ---
  .post("/logout", async ({ cookie: { access_token, refresh_token }, set }) => {
    const tokenValue = refresh_token.value;

    // 1. Cabut token dari database (Invalidasi Sesi)
    if (tokenValue) {
      await revokeRefreshTokenUseCase.execute(tokenValue);
    }

    // 2. Hapus cookie dari browser dengan memastikan path-nya benar
    access_token.set({
      value: '',
      path: '/',
      maxAge: 0
    });
    refresh_token.set({
      value: '',
      path: '/',
      maxAge: 0
    });

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
  }) // Menutup metode .post("/logout")
); // Menutup grup kedua dan mengakhiri rantai authRoutes