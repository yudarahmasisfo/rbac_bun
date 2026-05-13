import { Elysia, t } from "elysia";
import { PrismaRoleRepository } from "../../infrastructure/repositories/prisma-role.repository";
import { CreateRoleUseCase } from "../../application/usecases/role/create-role.usecase";
import { UpdateRoleUseCase } from "../../application/usecases/role/update-role.usecase";
import { DeleteRoleUseCase } from "../../application/usecases/role/delete-role.usecase";
import { AssignPermissionToRoleUseCase } from "../../application/usecases/role/assign-permission-to-role.usecase";
import { GetRoleDetailUseCase } from "../../application/usecases/role/get-role-detail.usecase";
import {
  rbacPlugin,
  hasPermission,
} from "../middleware/rbac.plugin";

const roleRepo = new PrismaRoleRepository();
const createRoleUseCase = new CreateRoleUseCase(roleRepo);
const updateUseCase = new UpdateRoleUseCase(roleRepo);
const deleteUseCase = new DeleteRoleUseCase(roleRepo);
const assignPermissionToRoleUseCase = new AssignPermissionToRoleUseCase(roleRepo);
const getRoleDetailUseCase = new GetRoleDetailUseCase(roleRepo);


export const roleRoutes = new Elysia({ prefix: '/roles' })

 .use(rbacPlugin)

  // 1. LIHAT SEMUA ROLE
  .get(
    "/",
    async () => {

      const roles = await roleRepo.findAll();

      if (roles.length === 0) {
        return {
          message: "Data masih kosong di tabel role",
          data: [],
        };
      }

      return {
        message: "Data role berhasil dimuat",
        data: roles,
      };
    },
    {
      beforeHandle: hasPermission("ROLE_READ"),
    }
  )
  
  // 2. LIHAT DETAIL ROLE BERDASARKAN ID
  .get(
    "/:id",
    async ({ params: { id }, set }) => {

      try {

        const role =
          await getRoleDetailUseCase.execute(id);

        return {
          message: "Data role berhasil ditemukan",
          data: role,
        };

      } catch (e: any) {

        set.status = 404;

        return {
          error: e.message,
        };
      }
    },
    {
      beforeHandle: hasPermission("ROLE_READ"),
    }
  )

  // 3. TAMBAH ROLE
.post(
    "/",
    async ({ body, set }) => {

      try {

        const newRole =
          await createRoleUseCase.execute(body);

        set.status = 201;

        return {
          message: "Role berhasil ditambahkan",
          data: newRole,
        };

      } catch (e: any) {

        set.status = 400;

        return {
          error: e.message,
        };
      }
    },
    {
      beforeHandle: hasPermission("ROLE_CREATE"),

      body: t.Object({
        name: t.String(),
        description: t.Optional(t.String()),
        permissionIds: t.Array(t.String()),
      }),
    }
  )

  // 4. UPDATE ROLE (NAMA, DESKRIPSI, ATAU PERMISSIONS)
 .patch(
    "/:id",
    async ({ params: { id }, body, set }) => {

      try {

        const updatedRole =
          await updateUseCase.execute(id, body);

        return {
          message:
            "Data update role berhasil",
          data: updatedRole,
        };

      } catch (e: any) {

        set.status = 400;

        return {
          error: e.message,
        };
      }
    },
    {
      beforeHandle: hasPermission("ROLE_UPDATE"),

      body: t.Object({
        name: t.Optional(t.String()),
        description: t.Optional(t.String()),
        permissionIds: t.Optional(
          t.Array(t.String())
        ),
      }),
    }
  )

  
 // 5. HAPUS ROLE
 .delete(
    "/:id",
    async ({ params: { id }, set }) => {

      try {

        await deleteUseCase.execute(id);

        return {
          message: "Role berhasil dihapus",
        };

      } catch (e: any) {

        set.status = 400;

        return {
          error: e.message,
        };
      }
    },
    {
      beforeHandle: hasPermission("ROLE_DELETE"),
    }
  )

 // 6. ASSIGN PERMISSION KE ROLE (UPDATE KHUSUS PERMISSION SAJA)
.put(
    "/:id/permissions",
    async ({ params: { id }, body, set }) => {

      try {

        const updatedRole =
          await assignPermissionToRoleUseCase.execute(
            id,
            body
          );

        return {
          message:
            "Permission role berhasil diperbarui",
          data: updatedRole,
        };

      } catch (e: any) {

        set.status = 400;

        return {
          error: e.message,
        };
      }
    },
    {
      beforeHandle:
        hasPermission("ROLE_ASSIGN_PERMISSION"),

      body: t.Object({
        permissionIds: t.Array(t.String()),
      }),
    }
  );
  
