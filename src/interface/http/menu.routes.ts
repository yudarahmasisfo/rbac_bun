import { Elysia } from "elysia";
import { MenuRepository } from "../../infrastructure/repositories/menu.repository";
import { GetSidebarUseCase } from "../../application/usecases/menu/get-sidebar.usecase";
import { hasPermission, rbacPlugin } from "../middleware/rbac.plugin";
import { DeleteMenuUseCase } from "../../application/usecases/menu/delete-menu.usecase";
import { GetMenusUseCase } from "../../application/usecases/menu/get-menus.usecase";
import { GetMenuByIdUseCase } from "../../application/usecases/menu/get-menu-by-id.usecase";
import { CreateMenuUseCase } from "../../application/usecases/menu/create-menu.usecase";
import { UpdateMenuUseCase } from "../../application/usecases/menu/update-menu.usecase";

// Inisialisasi Use Case & Repository
const menuRepo = new MenuRepository();
const getSidebarUseCase = new GetSidebarUseCase(menuRepo);

const getMenusUseCase =
  new GetMenusUseCase(menuRepo);

const getMenuByIdUseCase =
  new GetMenuByIdUseCase(menuRepo);

const createMenuUseCase =
  new CreateMenuUseCase(menuRepo);

const updateMenuUseCase =
  new UpdateMenuUseCase(menuRepo);

const deleteMenuUseCase =
  new DeleteMenuUseCase(menuRepo);

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
  })

  .get("/all", async () => {
    return await getMenusUseCase.execute();
  })

  .get(
    "/:id",

    async ({ params }: any) => {
      return await getMenuByIdUseCase.execute(
        params.id
      );
    }
  )

  .post(
    "/",

    hasPermission("create_menu"),

    async ({
      body,
    }: {
      body: any
    }) => {

      return await createMenuUseCase.execute(
        body
      );
    }
  )

  .put(
    "/:id",

    hasPermission("update_menu"),

    async ({
      params,
      body,
    }: {
      params: { id: string },
      body: any
    }) => {

      return await updateMenuUseCase.execute(
        params.id,
        body
      );
    }
  )

  .delete(
    "/:id",

    hasPermission("delete_menu"),

    async ({ params }: any) => {

      return await deleteMenuUseCase.execute(
        params.id
      );
    }
  );