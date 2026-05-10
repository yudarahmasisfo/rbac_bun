import { Elysia } from "elysia";
import { PrismaUserRepository } from "../../ infrastructure/ repositories/prisma-user.repository";
import { RegisterUserUseCase } from "../../ application/ usecases/user/register-user.usecase";
import { UpdateUserUseCase } from "../../ application/ usecases/user/update-user.usecase";
import { DeleteUserUseCase } from "../../ application/ usecases/user/delete-user.usecase";
import { GetAllUsersUseCase } from "../../ application/ usecases/user/get-all-users.usecase";

const userRepo = new PrismaUserRepository();
const registerUseCase = new RegisterUserUseCase(userRepo);
const updateUseCase = new UpdateUserUseCase(userRepo);
const deleteUseCase = new DeleteUserUseCase(userRepo);
const getAllUsersUseCase = new GetAllUsersUseCase(userRepo);

// Helper untuk menyembunyikan password dari response API demi keamanan
const sanitizeUser = (user: any) => {
  if (!user) return null;
  const { password, ...userWithoutPassword } = user;
  return userWithoutPassword;
};

export const userRoutes = new Elysia({ prefix: '/users' })
  // 1. DAFTAR LIST USER
  // .get("/", async () => {
  //   const users = await userRepo.findAll();
  //   return users.map(user => sanitizeUser(user));
  // })

  // ENDPOINT: Daftar Semua User
  .get("/", async () => {
    return await getAllUsersUseCase.execute();
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
    }
  })

  // 5. HAPUS USER
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
  });