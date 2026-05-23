import { Elysia, t } from "elysia";

import { PrismaUserRepository } from "../../infrastructure/repositories/prisma-user.repository";

import { RegisterUserUseCase } from "../../application/usecases/user/register-user.usecase";

import { UpdateUserUseCase } from "../../application/usecases/user/update-user.usecase";

import { DeleteUserUseCase } from "../../application/usecases/user/delete-user.usecase";

import { GetAllUsersUseCase } from "../../application/usecases/user/get-all-users.usecase";

import { AssignRoleUseCase } from "../../application/usecases/user/assign-role.usecase";

import { GetUserDetailUseCase } from "../../application/usecases/user/get-user-detail.usecase";

import { ActivateUserUseCase } from "../../application/usecases/user/activate-user.usecase";

import { DeactivateUserUseCase } from "../../application/usecases/user/deactivate-user.usecase";

import { PrismaRefreshTokenRepository } from "../../infrastructure/repositories/prisma-refresh-token.repository";

import { hasPermission, rbacPlugin } from "../middleware/rbac.plugin";

const userRepo = new PrismaUserRepository();

const refreshTokenRepo = new PrismaRefreshTokenRepository();

const registerUseCase = new RegisterUserUseCase(userRepo);

const updateUseCase = new UpdateUserUseCase(userRepo);

const assignRoleUseCase = new AssignRoleUseCase(userRepo);

const deleteUseCase = new DeleteUserUseCase(userRepo);

const getAllUsersUseCase = new GetAllUsersUseCase(userRepo);

const getUserDetailUseCase = new GetUserDetailUseCase(userRepo);

const activateUserUseCase = new ActivateUserUseCase(userRepo);

const deactivateUserUseCase = new DeactivateUserUseCase(userRepo, refreshTokenRepo);

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
        async ({ query }) => {
          // Konversi query string ke boolean
          let isActiveFilter: boolean | undefined = undefined;
          if (query.isActive === 'true') isActiveFilter = true;
          if (query.isActive === 'false') isActiveFilter = false;

          // Pastikan execute() pada GetAllUsersUseCase sudah diupdate untuk menerima parameter
          const users = await getAllUsersUseCase.execute(isActiveFilter);

          return {
            success: true,
            message: "Data user berhasil dimuat",
            data: users.map((user: any) => sanitizeUser(user))
          };
        },
        {
          detail: {
            summary: "Daftar Semua Pengguna",
            description: "Mengambil semua daftar user. Izin: USER_ALL atau SUPER_ADMIN.",
            tags: ["Users"],
            security: [{ BearerAuth: [] }]
          },
          query: t.Object({
            isActive: t.Optional(t.String({ description: "Filter status aktif (true/false)" }))
          }),
          beforeHandle: hasPermission("USER_ALL"),
        },
      )

      // GET DETAIL USER
      .get(
        "/:id",
        async ({ params: { id }, set }) => {
          const user = await getUserDetailUseCase.execute(id);

          return {
            success: true,
            message: "Data user berhasil ditemukan",
            data: sanitizeUser(user),
          };
        },
        {
          detail: {
            summary: "Detail Pengguna",
            description: "Melihat informasi detail user berdasarkan ID. Izin: USER_READ atau SUPER_ADMIN.",
            tags: ["Users"],
            security: [{ BearerAuth: [] }]
          },
          beforeHandle: hasPermission("USER_READ"),
        },
      )

      // CREATE USER
      .post(
        "/",
        async ({ body, set }) => {
          const newUser = await registerUseCase.execute(body);

          set.status = 201;

          return {
            success: true,
            message: "User berhasil didaftarkan",
            data: sanitizeUser(newUser),
          };
        },
        {
          detail: {
            summary: "Registrasi Pengguna Baru",
            description: "Membuat akun user baru dan memberikan role. Izin: USER_CREATE atau SUPER_ADMIN.",
            tags: ["Users"],
            security: [{ BearerAuth: [] }]
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
            photo: t.Optional(t.File({ 
              maxSize: 2 * 1024 * 1024, // 2MB dalam bytes
              type: ['image/jpeg', 'image/png'],
              description: "File foto profil (Max 2MB, format JPG/PNG)"
            })),
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
          const updatedUser = await updateUseCase.execute(id, body);

          return {
            success: true,
            message: "User berhasil diperbarui",
            data: sanitizeUser(updatedUser),
          };
        },
        {
          detail: {
            summary: "Update Data Pengguna",
            description: "Memperbarui profil atau password user. Izin: USER_UPDATE atau SUPER_ADMIN.",
            tags: ["Users"],
            security: [{ BearerAuth: [] }]
          },
          beforeHandle: hasPermission("USER_UPDATE"),

          body: t.Object({
            username: t.Optional(t.String({ description: "Username baru" })),
            name: t.Optional(t.String({ description: "Nama lengkap baru" })),
            photo: t.Optional(t.File({ 
              maxSize: 2 * 1024 * 1024,
              type: ['image/jpeg', 'image/png'],
              description: "File foto profil baru (Max 2MB, format JPG/PNG)" 
            })),
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
          const updatedUser = await assignRoleUseCase.execute(id, body);

          return {
            success: true,
            message: "Peran user berhasil diperbarui",
            data: sanitizeUser(updatedUser),
          };
        },
        {
          detail: {
            summary: "Ganti Role Pengguna",
            description: "Mengganti role user secara permanen. Izin: USER_ASSIGN_ROLE atau SUPER_ADMIN.",
            tags: ["Users"],
            security: [{ BearerAuth: [] }]
          },
          beforeHandle: hasPermission("USER_ASSIGN_ROLE"),

          body: t.Object({
            roleIds: t.Array(t.String({ 
              description: "Array UUID dari tabel Role" 
            })),
          }),
        },
      )

      // AKTIVASI USER (USER_ACTIVATE)
      .post(
        "/:id/activate",
        async ({ params: { id } }) => {
          const user = await activateUserUseCase.execute(id);
          return {
            success: true,
            message: "User berhasil diaktifkan. Sekarang user bisa melakukan login.",
            data: sanitizeUser(user)
          };
        },
        {
          detail: {
            summary: "Mengaktifkan User",
            description: "Mengubah status user menjadi aktif agar bisa login. Izin: USER_ACTIVATE atau SUPER_ADMIN.",
            tags: ["Users"],
            security: [{ BearerAuth: [] }]
          },
          beforeHandle: hasPermission("USER_ACTIVATE")
        }
      )

      // DEAKTIVASI USER (USER_DEACTIVATE)
      .post(
        "/:id/deactivate",
        async ({ params: { id }, user }) => {
          // Kita kirim user.id (admin) untuk mencegah mematikan akun sendiri
          const adminId = (user as any)?.id;
          const result = await deactivateUserUseCase.execute(id, adminId);
          
          return {
            success: true,
            message: "User berhasil dinonaktifkan dan semua sesi aktif telah dicabut.",
            data: sanitizeUser(result)
          };
        },
        {
          detail: {
            summary: "Menonaktifkan User",
            description: "Menonaktifkan akun dan mencabut semua sesi aktif (logout paksa). Izin: USER_DEACTIVATE atau SUPER_ADMIN.",
            tags: ["Users"],
            security: [{ BearerAuth: [] }]
          },
          beforeHandle: hasPermission("USER_DEACTIVATE")
        }
      )

      // DELETE USER
      .delete(
        "/:id",
        async ({ params: { id }, set }) => {
          await deleteUseCase.execute(id);

          return {
            success: true,
            message: "User dan relasi perannya berhasil dihapus selamanya",
          };
        },
        {
          detail: {
            summary: "Hapus Pengguna",
            description: "Menghapus user secara permanen dari sistem. Izin: USER_DELETE atau SUPER_ADMIN.",
            tags: ["Users"],
            security: [{ BearerAuth: [] }]
          },
          beforeHandle: hasPermission("USER_DELETE"),
        },
      ),
  );
