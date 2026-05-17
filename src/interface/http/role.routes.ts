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
          success: true,
          message: "Data masih kosong di tabel role",
          data: [],
        };
      }

      return {
        success: true,
        message: "Data role berhasil dimuat",
        data: roles,
      };
    },
    {
      detail: {
        summary: "Daftar Semua Role",
        tags: ["Roles"]
      },
      beforeHandle: hasPermission("ROLE_ALL"),
    }
  )
  
  // 2. LIHAT DETAIL ROLE BERDASARKAN ID
  .get(
    "/:id",
    async ({ params: { id }, set }) => {
      const role =
        await getRoleDetailUseCase.execute(id);

      return {
        success: true,
        message: "Data role berhasil ditemukan",
        data: role,
      };
    },
    {
      detail: {
        summary: "Detail Role",
        tags: ["Roles"]
      },
      beforeHandle: hasPermission("ROLE_READ"),
    }
  )

  // 3. TAMBAH ROLE
.post(
    "/",
    async ({ body, set }) => {
      const newRole =
        await createRoleUseCase.execute(body);

      set.status = 201;

      return {
        success: true,
        message: "Role berhasil ditambahkan",
        data: newRole,
      };
    },
    {
      detail: {
        summary: "Tambah Role Baru",
        tags: ["Roles"]
      },
      beforeHandle: hasPermission("ROLE_CREATE"),

      body: t.Object({
        name: t.String({ description: "Nama role", examples: ["ADMIN"] }),
        description: t.Optional(t.String({ description: "Deskripsi peran" })),
        permissionIds: t.Array(t.String({ description: "Array ID Permission (UUID)" }), {
          description: "Berikan minimal 1 permission"
        }),
      }),
    }
  )

  // 4. UPDATE ROLE (NAMA, DESKRIPSI, ATAU PERMISSIONS)
 .patch(
    "/:id",
    async ({ params: { id }, body, set }) => {
      const updatedRole =
        await updateUseCase.execute(id, body);

      return {
        success: true,
        message: "Data update role berhasil",
        data: updatedRole,
      };
    },
    {
      detail: {
        summary: "Update Data Role",
        tags: ["Roles"]
      },
      beforeHandle: hasPermission("ROLE_UPDATE"),

      body: t.Object({
        name: t.Optional(t.String({ description: "Nama baru" })),
        description: t.Optional(t.String({ description: "Deskripsi baru" })),
        permissionIds: t.Optional(t.Array(t.String({ description: "Ganti daftar permission" }))),
      }),
    }
  )

  
 // 5. HAPUS ROLE
 .delete(
    "/:id",
    async ({ params: { id }, set }) => {
      await deleteUseCase.execute(id);

      return {
        success: true,
        message: "Role berhasil dihapus",
      };
    },
    {
      detail: {
        summary: "Hapus Role",
        tags: ["Roles"]
      },
      beforeHandle: hasPermission("ROLE_DELETE"),
    }
  )

 // 6. ASSIGN PERMISSION KE ROLE (UPDATE KHUSUS PERMISSION SAJA)
.put(
    "/:id/permissions",
    async ({ params: { id }, body, set }) => {
      const updatedRole =
        await assignPermissionToRoleUseCase.execute(
          id,
          body
        );

      return {
        success: true,
        message: "Permission role berhasil diperbarui",
        data: updatedRole,
      };
    },
    {
      detail: {
        summary: "Ganti Permission pada Role",
        description: "Khusus untuk memperbarui daftar izin tanpa mengubah nama role.",
        tags: ["Roles"]
      },
      beforeHandle:
        hasPermission("ROLE_ASSIGN_PERMISSION"),

      body: t.Object({
        permissionIds: t.Array(t.String({ description: "Array UUID Permission" })),
      }),
    }
  );
  
