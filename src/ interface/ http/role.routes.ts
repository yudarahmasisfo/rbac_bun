import { Elysia, t } from "elysia";
import { PrismaRoleRepository } from "../../ infrastructure/ repositories/prisma-role.repository";
import { CreateRoleUseCase } from "../../ application/ usecases/role/create-role.usecase";
import { UpdateRoleUseCase } from "../../ application/ usecases/role/update-role.usecase";
import { DeleteRoleUseCase } from "../../ application/ usecases/role/delete-role.usecase";

const roleRepo = new PrismaRoleRepository();
const createRoleUseCase = new CreateRoleUseCase(roleRepo);
const updateUseCase = new UpdateRoleUseCase(roleRepo);
const deleteUseCase = new DeleteRoleUseCase(roleRepo);

export const roleRoutes = new Elysia({ prefix: '/roles' })
  // 1. LIHAT SEMUA ROLE
  .get("/", async () => {
    return await roleRepo.findAll();
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
      return await createRoleUseCase.execute(body);
    } catch (e: any) {
      set.status = 400;
      return { error: e.message };
    }
  })

  // 4. UPDATE ROLE (NAMA, DESKRIPSI, ATAU PERMISSIONS)
  .patch("/:id", async ({ params: { id }, body, set }) => {
    try {
      return await updateUseCase.execute(id, body);
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
  });