// rbac.plugin.ts
import { Elysia } from "elysia";
import { jwt } from "@elysiajs/jwt";

export const rbacPlugin = new Elysia({ name: "rbac-plugin" })
  .use(
    jwt({
      name: "jwt",
      secret: process.env.JWT_SECRET || "fallback",
    })
  )
  .derive({ as: 'global' }, async ({ jwt, headers }) => {
    const authHeader = headers["authorization"] || headers["Authorization"];

    // Jika header sama sekali tidak ada
    if (!authHeader) {
      return { 
        user: null, 
        authError: "Token tidak ditemukan. Silakan login terlebih dahulu." 
      };
    }

    // Jika format bukan Bearer
    if (!authHeader.startsWith("Bearer ")) {
      return { 
        user: null, 
        authError: "Format token salah. Gunakan format 'Bearer <token>'." 
      };
    }

    const token = authHeader.split(" ")[1];

    try {
      const payload = await jwt.verify(token);

      if (!payload) {
        return { 
          user: null, 
          authError: "Token tidak valid atau sesi telah berakhir." 
        };
      }

      // Jika sukses
      return { user: payload, authError: null };
    } catch (e) {
      return { 
        user: null, 
        authError: "Terjadi kesalahan pada verifikasi keamanan." 
      };
    }
  });

export const hasPermission = (permission: string) => {
  return ({ user, authError, set }: any) => {
    // 1. Cek apakah ada error dari proses derive di atas
    if (authError) {
      set.status = 401;
      return { error: authError };
    }

    // 2. Cek apakah user payload tersedia
    if (!user) {
      set.status = 401;
      return { error: "Sesi tidak valid." };
    }

    // 3. Cek Permission (seperti biasa)
    const permissions = Array.isArray(user.permissions) ? user.permissions : [];

    if (!permissions.includes(permission)) {
      set.status = 403;
      return {
        error: `Akses ditolak. Anda tidak memiliki izin '${permission}'.`,
      };
    }
  };
};