import { Elysia, t } from "elysia";
import { PrismaUserRepository } from "../../ infrastructure/ repositories/prisma-user.repository";
import { RegisterUserUseCase } from "../../ application/ usecases/user/register-user.usecase";
import { UpdateUserUseCase } from "../../ application/ usecases/user/update-user.usecase";
import { DeleteUserUseCase } from "../../ application/ usecases/user/delete-user.usecase";
import { GetAllUsersUseCase } from "../../ application/ usecases/user/get-all-users.usecase";
import { AssignRoleUseCase } from "../../ application/ usecases/user/assign-role.usecase";
import { GetUserDetailUseCase } from "../../ application/ usecases/user/get-user-detail.usecase";


const userRepo = new PrismaUserRepository();
const registerUseCase = new RegisterUserUseCase(userRepo);
const updateUseCase = new UpdateUserUseCase(userRepo);
const assignRoleUseCase = new AssignRoleUseCase(userRepo);
const deleteUseCase = new DeleteUserUseCase(userRepo);
const getAllUsersUseCase = new GetAllUsersUseCase(userRepo);
const getUserDetailUseCase = new GetUserDetailUseCase(userRepo);

// Helper untuk menyembunyikan password dari response API demi keamanan
const sanitizeUser = (user: any) => {
  if (!user) return null;
  const { password, ...userWithoutPassword } = user;
  return userWithoutPassword;
};

export const userRoutes = new Elysia({ prefix: '/users' })
  // 1. DAFTAR LIST USER
  // ENDPOINT: Daftar Semua User
  .get("/", async () => {
    const users = await getAllUsersUseCase.execute();
    return users.map((user: any) => sanitizeUser(user));
  })

  // 2. DETAIL USER BERDASARKAN ID
  .get("/:id", async ({ params: { id }, set }) => {
    const user = await userRepo.findById(id);
    if (!user) {
      set.status = 404;
      return { error: "User tidak ditemukan" };
    }
    return sanitizeUser(user);
  })

  // 3. TAMBAH USER (REGISTRASI)
  .post("/", async ({ body, set }) => {
    try {
      const newUser = await registerUseCase.execute(body);
      set.status = 201;
      return {
        message: "User berhasil didaftarkan",
        data: sanitizeUser(newUser)
      };
    } catch (e: any) {
      set.status = 400;
      return { error: e.message };
    }
  }, {
    // Validasi skema input untuk POST
    body: t.Object({
      username: t.String(),
      name: t.String(),
      email: t.String(),
      password: t.String(),
      roleIds: t.Array(t.String())
    })  
  })

  // 4. EDIT USER
  .patch("/:id", async ({ params: { id }, body, set }) => {
    try {
      const updatedUser = await updateUseCase.execute(id, body);
      return {
        message: "User berhasil diperbarui",
        data: sanitizeUser(updatedUser)
      };
    } catch (e: any) {
      set.status = 400;
      return { error: e.message };
    }}, {
    // Validasi skema input untuk PATCH
    body: t.Object({
      username: t.Optional(t.String()),
      name: t.Optional(t.String()),
      email: t.Optional(t.String()),
      password: t.Optional(t.String()),
      roleIds: t.Optional(t.Array(t.String()))
    })
  })

  // --- 5. ASSIGN ROLE (KHUSUS PERUBAHAN PERAN) ---
  .put("/:id/roles", async ({ params: { id }, body, set }) => {
    try {
      const updatedUser = await assignRoleUseCase.execute(id, body);
      return {
        message: "Peran user berhasil diperbarui",
        data: sanitizeUser(updatedUser)
      };
    } catch (e: any) {
      set.status = 400;
      return { error: e.message };
    }
  }, {
    body: t.Object({
      roleIds: t.Array(t.String())
    })
  })

  // 6. HAPUS USER
    .delete("/:id", async ({ params: { id }, set }) => {
    try {
      await deleteUseCase.execute(id);
      
      return { 
        message: "User dan relasi perannya berhasil dihapus selamanya" 
      };
    } catch (e: any) {
      // Jika user tidak ditemukan, kirim status 404
      set.status = 404;
      return { error: e.message };
    }
  })
  
  // --- LIHAT DETAIL USER BERDASARKAN UUID ---
  .get("/:id", async ({ params: { id }, set }) => {
    try {
      const user = await getUserDetailUseCase.execute(id);
      
      // Hapus data sensitif seperti password sebelum dikirim ke client
      const { password, ...safeUserData } = user as any;

      return {
        message: "Data user berhasil ditemukan",
        data: safeUserData
      };
    } catch (e: any) {
      set.status = 404;
      return { error: e.message };
    }
  });