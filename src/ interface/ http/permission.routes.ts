import { Elysia, t } from "elysia";
import { PrismaPermissionRepository } from "../../ infrastructure/ repositories/prisma-permission.repository";
import { GetPermissionsUseCase } from "../../ application/ usecases/permission/get-permissions.usecase";
import { CreatePermissionUseCase } from "../../ application/ usecases/permission/create-permission.usecase";
import { UpdatePermissionUseCase } from "../../ application/ usecases/permission/update-permission.usecase";
import { DeletePermissionUseCase } from "../../ application/ usecases/permission/delete-permission.usecase";


// Dependency Injection manual untuk saat ini
const permissionRepo = new PrismaPermissionRepository();

// Inisialisasi Use Cases
const getUseCase = new GetPermissionsUseCase(permissionRepo);
const createUseCase = new CreatePermissionUseCase(permissionRepo);
const updateUseCase = new UpdatePermissionUseCase(permissionRepo);
const deleteUseCase = new DeletePermissionUseCase(permissionRepo);

export const permissionRoutes = new Elysia({ prefix: '/permissions' })
  // [GET] Ambil semua permission
  .get("/", async () => {
    return await getUseCase.execute();
  })

  // [POST] Buat permission baru
  .post("/", async ({ body, set }) => {
    try {
      const result = await createUseCase.execute(body.name, body.description);
      set.status = 201; // Created
      return result;
    } catch (error: any) {
      set.status = 400;
      return { error: error.message };
    }
  }, {
    body: t.Object({
      name: t.String({ minLength: 3, error: "Nama minimal 3 karakter" }),
      description: t.Optional(t.String())
    })
  })

  // --- FITUR EDIT (UPDATE) ---
  .patch("/:id", async ({ params: { id }, body, set }) => {
    try {
      return await updateUseCase.execute(id, body);
    } catch (error: any) {
      set.status = 404;
      return { error: error.message };
    }
  }, {
    body: t.Object({
      name: t.Optional(t.String()),
      description: t.Optional(t.String())
    })
  })

  // --- FITUR HAPUS (DELETE) ---
  .delete("/:id", async ({ params: { id }, set }) => {
    try {
      await deleteUseCase.execute(id);
      return { message: "Permission berhasil dihapus" };
    } catch (error: any) {
      set.status = 404;
      return { error: error.message };
    }
  });