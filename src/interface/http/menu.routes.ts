import { Elysia } from "elysia";
import { MenuRepository } from "../../infrastructure/repositories/menu.repository";
import { GetSidebarUseCase } from "../../application/usecases/menu/get-sidebar.usecase";
import { rbacPlugin } from "../middleware/rbac.plugin";

// Inisialisasi Use Case & Repository
const menuRepo = new MenuRepository();
const getSidebarUseCase = new GetSidebarUseCase(menuRepo);

export const menuRoutes = new Elysia({ prefix: '/menus' })
  /**
   * Menggunakan rbacPlugin yang sudah memiliki .derive().
   * Ini memastikan object 'user' sudah tersedia di dalam context.
   */
  .use(rbacPlugin)
  
  .get("/", async ({ user, set }: any) => {
    // 1. Validasi keberadaan user (Defense in depth)
    if (!user) {
      set.status = 401;
      return { 
        success: false,
        error: "Sesi berakhir atau token tidak valid." 
      };
    }

    try {
      /**
       * 2. AMBIL PERMISSION IDS (UUID)
       * Kita menggunakan 'permissionIds' karena MenuRepository sekarang 
       * memfilter berdasarkan UUID di database, bukan lagi nama string.
       */
      const permissionIds = (user as any).permissionIds || [];
      
      /**
       * 3. EKSEKUSI USE CASE
       * Mengirimkan array UUID ke use case untuk mendapatkan struktur menu bertingkat.
       */
      const sidebarData = await getSidebarUseCase.execute(permissionIds);

      return {
        success: true,
        message: "Sidebar menu berhasil dimuat",
        data: sidebarData
      };
      
    } catch (error: any) {
      set.status = 500;
      return { 
        success: false,
        error: "Gagal memproses data menu: " + error.message 
      };
    }
  });