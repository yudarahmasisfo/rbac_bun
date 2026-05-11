import { Elysia, t } from "elysia";
import { PrismaPermissionRepository } from "../../ infrastructure/ repositories/prisma-permission.repository";
import { GetPermissionDetailUseCase, GetPermissionsUseCase } from "../../ application/ usecases/permission/get-permissions.usecase";
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
const getDetailUseCase = new GetPermissionDetailUseCase(permissionRepo);

export const permissionRoutes = new Elysia({ prefix: '/permissions' })
  // [GET] Ambil semua permission
  
  .get("/", async () => {
      const data = await getUseCase.execute();
      if (data.length === 0) {
        return { message: "Data masih kosong di tabel permission", data: [] };
      }
      return { message: "Data permission berhasil dimuat", data };
    })

  // [POST] Buat permission baru
.post("/", async ({ body, set }) => {
    try {
      const result = await createUseCase.execute(body);
      set.status = 201;
      return { message: "Permission berhasil ditambahkan", data: result };
    } catch (error: any) {
      set.status = 400;
      return { error: error.message };
    }
  }, { body: t.Object({ name: t.Any(), description: t.Any() }) })

  // --- FITUR EDIT (UPDATE) ---
  .patch("/:id", async ({ params: { id }, body, set }) => {
    try {
      const result = await updateUseCase.execute(id, body);
      return { message: "Permission berhasil diperbarui", data: result };
    } catch (error: any) {
      set.status = 404;
      return { error: error.message };
    }
  }, { body: t.Object({ name: t.Any(), description: t.Any() })
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
  })
  
  // --- LIHAT DETAIL PERMISSION (BERDASARKAN UUID) ---
  .get("/:id", async ({ params: { id }, set }) => {
    try {
      const data = await getDetailUseCase.execute(id);
      return {
        message: "Data permission berhasil ditemukan",
        data: data
      };
    } catch (error: any) {
      // Jika UUID tidak ditemukan atau format salah
      set.status = 404;
      return { error: error.message };
    }
  });