// rbac.plugin.ts
import { Elysia } from "elysia";
import { jwt } from "@elysiajs/jwt";
import { appConfig } from "../../config/app.config";

export const rbacPlugin = new Elysia({ name: "rbac-plugin" })
  .use(
    jwt({
      name: "accessJwt",
      secret: appConfig.jwt.secret, // Menggunakan secret untuk Access Token dari appConfig
    })
  )
  .derive({ as: 'global' }, async ({ accessJwt, cookie, headers }) => {
    // 1. Ambil token dari Cookie ATAU Header Authorization (Bearer)
    // Ini agar Swagger (Bearer) dan Frontend (Cookie) keduanya bisa bekerja.
    let token = cookie.access_token?.value;

    if (!token && headers.authorization?.startsWith("Bearer ")) {
      token = headers.authorization.substring(7);
    }

    if (!token) {
      return { 
        user: null, 
        authError: "Sesi tidak ditemukan. Silakan login terlebih dahulu." 
      };
    }

    try {
      // 2. Verifikasi menggunakan instance accessJwt
      const payload = await accessJwt.verify(token as string);

      if (!payload) {
        return { 
          user: null, 
          authError: "Sesi telah berakhir atau tidak valid. Silakan login kembali." 
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

    // 3. Bypass jika user adalah SUPERADMIN
    const roleIds = Array.isArray(user.roleIds) ? user.roleIds : [];
    if (roleIds.includes(appConfig.superAdminRoleId)) {
      return;
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