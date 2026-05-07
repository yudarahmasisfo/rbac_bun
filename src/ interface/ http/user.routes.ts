import { Elysia } from "elysia";
import { PrismaUserRepository } from "../../ infrastructure/ repositories/prisma-user.repository";
import { RegisterUserUseCase } from "../../ application/ usecases/user/register-user.usecase";
import { UpdateUserUseCase } from "../../ application/ usecases/user/update-user.usecase";

const userRepo = new PrismaUserRepository();
const registerUseCase = new RegisterUserUseCase(userRepo);
const updateUseCase = new UpdateUserUseCase(userRepo);

// Helper untuk menyembunyikan password dari response API demi keamanan
const sanitizeUser = (user: any) => {
  if (!user) return null;
  const { password, ...userWithoutPassword } = user;
  return userWithoutPassword;
};

export const userRoutes = new Elysia({ prefix: '/users' })
  // 1. DAFTAR LIST USER
  .get("/", async () => {
    const users = await userRepo.findAll();
    return users.map(user => sanitizeUser(user));
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
      const existingUser = await userRepo.findById(id);
      if (!existingUser) {
        set.status = 404;
        return { error: "User tidak ditemukan" };
      }
      
      await userRepo.delete(id);
      return { message: "User berhasil dihapus" };
    } catch (e: any) {
      set.status = 400;
      return { error: e.message };
    }
  });