import { Elysia, t } from "elysia";

import { PrismaUserRepository } from "../../infrastructure/repositories/prisma-user.repository";

import { RegisterUserUseCase } from "../../application/usecases/user/register-user.usecase";

import { UpdateUserUseCase } from "../../application/usecases/user/update-user.usecase";

import { DeleteUserUseCase } from "../../application/usecases/user/delete-user.usecase";

import { GetAllUsersUseCase } from "../../application/usecases/user/get-all-users.usecase";

import { AssignRoleUseCase } from "../../application/usecases/user/assign-role.usecase";

import { GetUserDetailUseCase } from "../../application/usecases/user/get-user-detail.usecase";

import { hasPermission, rbacPlugin } from "../middleware/rbac.plugin";

const userRepo = new PrismaUserRepository();

const registerUseCase = new RegisterUserUseCase(userRepo);

const updateUseCase = new UpdateUserUseCase(userRepo);

const assignRoleUseCase = new AssignRoleUseCase(userRepo);

const deleteUseCase = new DeleteUserUseCase(userRepo);

const getAllUsersUseCase = new GetAllUsersUseCase(userRepo);

const getUserDetailUseCase = new GetUserDetailUseCase(userRepo);

const sanitizeUser = (user: any) => {
  if (!user) return null;

  const { password, ...userWithoutPassword } = user;

  return userWithoutPassword;
};

export const userRoutes = new Elysia()

  .use(rbacPlugin)

  .group("/users", (app) =>
    app

      // GET ALL USERS
      .get(
        "/",
        async () => {
          const users = await getAllUsersUseCase.execute();

          return users.map((user: any) => sanitizeUser(user));
        },
        {
          detail: {
            summary: "Daftar Semua Pengguna",
            tags: ["Users"],
          },
          beforeHandle: hasPermission("USER_ALL"),
        },
      )

      // GET DETAIL USER
      .get(
        "/:id",
        async ({ params: { id }, set }) => {
          try {
            const user = await getUserDetailUseCase.execute(id);

            return {
              message: "Data user berhasil ditemukan",
              data: sanitizeUser(user),
            };
          } catch (e: any) {
            set.status = 404;

            return {
              error: e.message,
            };
          }
        },
        {
          detail: {
            summary: "Detail Pengguna",
            tags: ["Users"],
          },
          beforeHandle: hasPermission("USER_READ"),
        },
      )

      // CREATE USER
      .post(
        "/",
        async ({ body, set }) => {
          try {
            const newUser = await registerUseCase.execute(body);

            set.status = 201;

            return {
              message: "User berhasil didaftarkan",
              data: sanitizeUser(newUser),
            };
          } catch (e: any) {
            set.status = 400;

            return {
              error: e.message,
            };
          }
        },
        {
          detail: {
            summary: "Registrasi Pengguna Baru",
            description: "Membuat akun user baru dan langsung memberikan role.",
            tags: ["Users"],
          },
          beforeHandle: hasPermission("USER_CREATE"),
          body: t.Object({
            username: t.String({ 
              description: "Username unik untuk login",
              examples: ["yudapratama"] 
            }),
            name: t.String({ 
              description: "Nama lengkap pengguna",
              examples: ["Yuda Pratama"] 
            }),
            email: t.String({ 
              description: "Alamat email aktif",
              format: "email",
              examples: ["yuda@example.com"] 
            }),
            password: t.String({ 
              description: "Password minimal 8 karakter",
              examples: ["password123"] 
            }),
            roleIds: t.Array(t.String({ description: "Daftar ID Role (UUID)" }), {
              description: "Minimal harus menyertakan 1 Role ID"
            }),
          })
        },
      )

      // UPDATE USER
      .patch(
        "/:id",
        async ({ params: { id }, body, set }) => {
          try {
            const updatedUser = await updateUseCase.execute(id, body);

            return {
              message: "User berhasil diperbarui",
              data: sanitizeUser(updatedUser),
            };
          } catch (e: any) {
            set.status = 400;

            return {
              error: e.message,
            };
          }
        },
        {
          detail: {
            summary: "Update Data Pengguna",
            description: "Memperbarui informasi profil atau password user.",
            tags: ["Users"],
          },
          beforeHandle: hasPermission("USER_UPDATE"),

          body: t.Object({
            username: t.Optional(t.String({ description: "Username baru" })),
            name: t.Optional(t.String({ description: "Nama lengkap baru" })),
            email: t.Optional(t.String({ format: "email", description: "Email baru" })),
            password: t.Optional(t.String({ description: "Password baru (jika ingin diubah)" })),
            roleIds: t.Optional(t.Array(t.String({ description: "Update daftar Role ID" }))),
          }),
        },
      )

      // ASSIGN ROLE
      .put(
        "/:id/roles",
        async ({ params: { id }, body, set }) => {
          try {
            const updatedUser = await assignRoleUseCase.execute(id, body);

            return {
              message: "Peran user berhasil diperbarui",
              data: sanitizeUser(updatedUser),
            };
          } catch (e: any) {
            set.status = 400;

            return {
              error: e.message,
            };
          }
        },
        {
          detail: {
            summary: "Ganti Role Pengguna",
            description: "Menghapus role lama dan menggantinya dengan daftar role baru.",
            tags: ["Users"],
          },
          beforeHandle: hasPermission("USER_ASSIGN_ROLE"),

          body: t.Object({
            roleIds: t.Array(t.String({ 
              description: "Array UUID dari tabel Role" 
            })),
          }),
        },
      )

      // DELETE USER
      .delete(
        "/:id",
        async ({ params: { id }, set }) => {
          try {
            await deleteUseCase.execute(id);

            return {
              message: "User dan relasi perannya berhasil dihapus selamanya",
            };
          } catch (e: any) {
            set.status = 404;

            return {
              error: e.message,
            };
          }
        },
        {
          detail: {
            summary: "Hapus Pengguna",
            description: "Menghapus user secara permanen beserta relasi role-nya.",
            tags: ["Users"],
          },
          beforeHandle: hasPermission("USER_DELETE"),
        },
      ),
  );
