import { Elysia, t } from "elysia";

import { PrismaPermissionRepository } from "../../infrastructure/repositories/prisma-permission.repository";

import {
  GetPermissionDetailUseCase,
  GetPermissionsUseCase,
} from "../../application/usecases/permission/get-permissions.usecase";

import { CreatePermissionUseCase } from "../../application/usecases/permission/create-permission.usecase";

import { UpdatePermissionUseCase } from "../../application/usecases/permission/update-permission.usecase";

import { DeletePermissionUseCase } from "../../application/usecases/permission/delete-permission.usecase";

import {
  rbacPlugin,
  hasPermission,
} from "../middleware/rbac.plugin";

// ==================================================
// DEPENDENCY INJECTION
// ==================================================

const permissionRepo =
  new PrismaPermissionRepository();

// ==================================================
// USE CASES
// ==================================================

const getUseCase =
  new GetPermissionsUseCase(permissionRepo);

const createUseCase =
  new CreatePermissionUseCase(permissionRepo);

const updateUseCase =
  new UpdatePermissionUseCase(permissionRepo);

const deleteUseCase =
  new DeletePermissionUseCase(permissionRepo);

const getDetailUseCase =
  new GetPermissionDetailUseCase(permissionRepo);

// ==================================================
// ROUTES
// ==================================================

export const permissionRoutes = new Elysia({
  prefix: "/permissions",
})

  .use(rbacPlugin)

  // ==================================================
  // 1. GET ALL PERMISSIONS
  // ==================================================
  .get(
    "/",
    async () => {

      const data = await getUseCase.execute();

      if (data.length === 0) {

        return {
          message:
            "Data masih kosong di tabel permission",
          data: [],
        };
      }

      return {
        message:
          "Data permission berhasil dimuat",
        data,
      };
    },
    {
      beforeHandle:
        hasPermission("PERMISSION_READ"),
    }
  )

  // ==================================================
  // 2. GET DETAIL PERMISSION
  // ==================================================
  .get(
    "/:id",
    async ({ params: { id }, set }) => {

      try {

        const data =
          await getDetailUseCase.execute(id);

        return {
          message:
            "Data permission berhasil ditemukan",
          data,
        };

      } catch (error: any) {

        set.status = 404;

        return {
          error: error.message,
        };
      }
    },
    {
      beforeHandle:
        hasPermission("PERMISSION_READ"),
    }
  )

  // ==================================================
  // 3. CREATE PERMISSION
  // ==================================================
  .post(
    "/",
    async ({ body, set }) => {

      try {

        const result =
          await createUseCase.execute(body);

        set.status = 201;

        return {
          message:
            "Permission berhasil ditambahkan",
          data: result,
        };

      } catch (error: any) {

        set.status = 400;

        return {
          error: error.message,
        };
      }
    },
    {
      beforeHandle:
        hasPermission("PERMISSION_CREATE"),

      body: t.Object({
        name: t.String(),
        description: t.Optional(t.String()),
      }),
    }
  )

  // ==================================================
  // 4. UPDATE PERMISSION
  // ==================================================
  .patch(
    "/:id",
    async ({ params: { id }, body, set }) => {

      try {

        const result =
          await updateUseCase.execute(id, body);

        return {
          message:
            "Permission berhasil diperbarui",
          data: result,
        };

      } catch (error: any) {

        set.status = 404;

        return {
          error: error.message,
        };
      }
    },
    {
      beforeHandle:
        hasPermission("PERMISSION_UPDATE"),

      body: t.Object({
        name: t.Optional(t.String()),
        description: t.Optional(t.String()),
      }),
    }
  )

  // ==================================================
  // 5. DELETE PERMISSION
  // ==================================================
  .delete(
    "/:id",
    async ({ params: { id }, set }) => {

      try {

        await deleteUseCase.execute(id);

        return {
          message:
            "Permission berhasil dihapus",
        };

      } catch (error: any) {

        set.status = 404;

        return {
          error: error.message,
        };
      }
    },
    {
      beforeHandle:
        hasPermission("PERMISSION_DELETE"),
    }
  );