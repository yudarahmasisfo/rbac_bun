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
          beforeHandle: hasPermission("USER_CREATE"),
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
          beforeHandle: hasPermission("USER_UPDATE"),

          body: t.Object({
            username: t.Optional(t.String()),
            name: t.Optional(t.String()),
            email: t.Optional(t.String()),
            password: t.Optional(t.String()),
            roleIds: t.Optional(t.Array(t.String())),
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
          beforeHandle: hasPermission("USER_ASSIGN_ROLE"),

          body: t.Object({
            roleIds: t.Array(t.String()),
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
          beforeHandle: hasPermission("USER_DELETE"),
        },
      ),
  );
