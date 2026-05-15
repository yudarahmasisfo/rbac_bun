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
  .derive({ as: 'global' }, async ({ jwt, headers }) => { // Tambahkan { as: 'global' }
    const authHeader = headers["authorization"] || headers["Authorization"];

    if (!authHeader?.startsWith("Bearer ")) {
      return { user: null };
    }

    const token = authHeader.split(" ")[1];

    try {
      // Verifikasi token
      const payload = await jwt.verify(token);

      if (!payload) {
        console.log("❌ Derive: Token invalid");
        return { user: null };
      }

      console.log("✅ Derive: User verified ->", payload.username);
      return { user: payload };
    } catch (e) {
      console.log("❌ Derive: Error", e);
      return { user: null };
    }
  });

export const hasPermission = (permission: string) => {
  return ({ user, set }: any) => { // Tidak perlu async jika hanya cek array
    if (!user) {
      set.status = 401;
      return {
        error: "Token tidak valid, tidak ditemukan, atau sesi berakhir.",
      };
    }

    const permissions = Array.isArray(user.permissions) ? user.permissions : [];

    if (!permissions.includes(permission)) {
      set.status = 403;
      return {
        error: `Akses ditolak. Permission '${permission}' diperlukan.`,
      };
    }
  };
};