import { Elysia } from "elysia";
import { jwt } from "@elysiajs/jwt";

console.log("JWT SECRET:", process.env.JWT_SECRET);

export const rbacPlugin = new Elysia({ name: "rbac-plugin" })
  .use(
    jwt({
      name: "jwt",
      secret: process.env.JWT_SECRET || "fallback",
    })
  );

export const hasPermission = (permission: string) => {
  return async ({ jwt, headers, set }: any) => {

    const authHeader =
      headers["authorization"] ||
      headers["Authorization"];

    console.log("AUTH HEADER:", authHeader);

    // 1. cek header
    if (!authHeader?.startsWith("Bearer ")) {
      set.status = 401;

      return {
        error: "Token tidak ditemukan.",
      };
    }

    // 2. ambil token
    const token = authHeader.split(" ")[1];

    // 3. verify token
    const user = await jwt.verify(token);

    console.log("AUTH USER:", user);

    if (!user) {
      set.status = 401;

      return {
        error: "Token tidak valid atau sesi berakhir.",
      };
    }

    // 4. ambil permissions
    const permissions = Array.isArray((user as any).permissions)
      ? (user as any).permissions
      : [];

    console.log("PERMISSIONS:", permissions);

    // 5. cek permission
    if (!permissions.includes(permission)) {
      set.status = 403;

      return {
        error: `Akses ditolak. Permission '${permission}' diperlukan.`,
      };
    }

    // lanjut
  };
};