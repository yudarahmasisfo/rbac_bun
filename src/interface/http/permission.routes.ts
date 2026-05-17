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
          success: true,
          message:
            "Data masih kosong di tabel permission",
          data: [],
        };
      }

      return {
        success: true,
        message:
          "Data permission berhasil dimuat",
        data,
      };
    },
    {
      detail: {
        summary: "Daftar Semua Permission",
        tags: ["Permissions"]
      },
      beforeHandle:
        hasPermission("PERMISSION_ALL"),
    }
  )

  // ==================================================
  // 2. GET DETAIL PERMISSION
  // ==================================================
  .get(
    "/:id",
    async ({ params: { id }, set }) => {
      const data =
        await getDetailUseCase.execute(id);

      return {
        success: true,
        message:
          "Data permission berhasil ditemukan",
        data,
      };
    },
    {
      detail: {
        summary: "Detail Permission",
        tags: ["Permissions"]
      },
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
      const result =
        await createUseCase.execute(body);

      set.status = 201;

      return {
        success: true,
        message:
          "Permission berhasil ditambahkan",
        data: result,
      };
    },
    {
      detail: {
        summary: "Tambah Permission Baru",
        tags: ["Permissions"]
      },
      beforeHandle:
        hasPermission("PERMISSION_CREATE"),

      body: t.Object({
        name: t.String({ 
          description: "Nama unik permission",
          examples: ["USER_CREATE"] 
        }),
        description: t.Optional(t.String({ 
          description: "Penjelasan fungsi permission" 
        })),
      }),
    }
  )

  // ==================================================
  // 4. UPDATE PERMISSION
  // ==================================================
  .patch(
    "/:id",
    async ({ params: { id }, body, set }) => {
      const result =
        await updateUseCase.execute(id, body);

      return {
        success: true,
        message:
          "Permission berhasil diperbarui",
        data: result,
      };
    },
    {
      detail: {
        summary: "Update Permission",
        tags: ["Permissions"]
      },
      beforeHandle:
        hasPermission("PERMISSION_UPDATE"),

      body: t.Object({
        name: t.Optional(t.String({ description: "Ubah nama" })),
        description: t.Optional(t.String({ description: "Ubah deskripsi" })),
      }),
    }
  )

  // ==================================================
  // 5. DELETE PERMISSION
  // ==================================================
  .delete(
    "/:id",
    async ({ params: { id }, set }) => {
      await deleteUseCase.execute(id);

      return {
        success: true,
        message:
          "Permission berhasil dihapus",
      };
    },
    {
      detail: {
        summary: "Hapus Permission",
        tags: ["Permissions"]
      },
      beforeHandle:
        hasPermission("PERMISSION_DELETE"),
    }
  );