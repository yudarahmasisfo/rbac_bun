import { Elysia, t } from "elysia";
import { PrismaRoleRepository } from "../../ infrastructure/ repositories/prisma-role.repository";
import { CreateRoleUseCase } from "../../ application/ usecases/role/create-role.usecase";
import { UpdateRoleUseCase } from "../../ application/ usecases/role/update-role.usecase";
import { DeleteRoleUseCase } from "../../ application/ usecases/role/delete-role.usecase";
import { AssignPermissionToRoleUseCase } from "../../ application/ usecases/role/assign-permission-to-role.usecase";

const roleRepo = new PrismaRoleRepository();
const createRoleUseCase = new CreateRoleUseCase(roleRepo);
const updateUseCase = new UpdateRoleUseCase(roleRepo);
const deleteUseCase = new DeleteRoleUseCase(roleRepo);
const assignPermissionToRoleUseCase = new AssignPermissionToRoleUseCase(roleRepo);

export const roleRoutes = new Elysia({ prefix: '/roles' })
  // 1. LIHAT SEMUA ROLE
  .get("/", async () => {
    const roles = await roleRepo.findAll();
    // Cek apakah array roles kosong
    if (roles.length === 0) {
      return {
        message: "Data masih kosong di tabel role",
        data: []
      };
    }

    return {
      message: "Data role berhasil dimuat",
      data: roles
    };
  })
  
  // 2. LIHAT DETAIL ROLE BERDASARKAN ID
  .get("/:id", async ({ params: { id }, set }) => {
    const role = await roleRepo.findById(id);
    if (!role) {
      set.status = 404;
      return { error: "Role tidak ditemukan" };
    }
    return role;
  })

  // 3. TAMBAH ROLE
  .post("/", async ({ body, set }) => {
    try {
      const newRole = await createRoleUseCase.execute(body);
      set.status = 201; // Status 201 untuk 'Created'
      return {
        message: "Role berhasil ditambahkan",
        data: newRole
      };
    } catch (e: any) {
      set.status = 400;
      return { error: e.message };
    }
  }, {
    // Menambahkan validasi skema input agar lebih aman
    body: t.Object({
      name: t.String(),
      description: t.Optional(t.String()),
      permissionIds: t.Array(t.String())
    })
  })

  // 4. UPDATE ROLE (NAMA, DESKRIPSI, ATAU PERMISSIONS)
  .patch("/:id", async ({ params: { id }, body, set }) => {
    try {
      const updatedRole = await updateUseCase.execute(id, body);
      return {
        message: "Data update role dan permission berhasil di update", // <--- PESAN SUKSES DI SINI
        data: updatedRole
      };
    } catch (e: any) {
      set.status = 400;
      return { error: e.message };
    }
  }, {
    body: t.Object({
      name: t.Optional(t.String()),
      description: t.Optional(t.String()),
      permissionIds: t.Optional(t.Array(t.String()))
    })
  })
  
 // 5. HAPUS ROLE
  .delete("/:id", async ({ params: { id }, set }) => {
    try {
      await deleteUseCase.execute(id);
      return { message: "Role berhasil dihapus" };
    } catch (e: any) {
      set.status = 400;
      return { error: e.message };
    }
  })

 // 6. ASSIGN PERMISSION KE ROLE (UPDATE KHUSUS PERMISSION SAJA)
  .put("/:id/permissions", async ({ params: { id }, body, set }) => {
    try {
      // Panggil usecase assign permission ke role di sini
      const updatedRole = await assignPermissionToRoleUseCase.execute(id, body);
      return {
        message: "Data update role dan permission berhasil di update", // <--- PESAN SUKSES DI SINI
        data: updatedRole
      };
    } catch (e: any) {
      set.status = 400;
      return { error: e.message };
    }
  }, {
    // UBAH DI SINI: Gunakan t.Any() atau t.Object dengan t.Any() 
    // agar Joi di Use Case yang menangani pesan errornya
    body: t.Object({
      permissionIds: t.Array(t.String())
      //permissionIds: t.Any()
    })
  });       
