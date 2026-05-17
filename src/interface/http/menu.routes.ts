import { Elysia, t } from "elysia";
import { MenuRepository } from "../../infrastructure/repositories/menu.repository";
import { GetSidebarUseCase } from "../../application/usecases/menu/get-sidebar.usecase";
import { hasPermission, rbacPlugin } from "../middleware/rbac.plugin";
import { DeleteMenuUseCase } from "../../application/usecases/menu/delete-menu.usecase";
import { GetMenusUseCase } from "../../application/usecases/menu/get-menus.usecase";
import { GetMenuByIdUseCase } from "../../application/usecases/menu/get-menu-by-id.usecase";
import { CreateMenuUseCase } from "../../application/usecases/menu/create-menu.usecase";
import { UpdateMenuUseCase } from "../../application/usecases/menu/update-menu.usecase";
import { appConfig } from "../../config/app.config";

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
  
  // 1. GET SIDEBAR (Berdasarkan permission user yang login)
  .get("/", async ({ user, set }) => {
    /**
     * AMBIL PERMISSION IDS (UUID)
     */
    const permissionIds = (user as any).permissionIds || [];
    const roleIds = (user as any).roleIds || []; 
    const isSuperAdmin = roleIds.includes(appConfig.superAdminRoleId); 
    
    const sidebarData = await getSidebarUseCase.execute(permissionIds, isSuperAdmin);

    return {
      success: true,
      message: "Sidebar menu berhasil dimuat",
      data: sidebarData
    };
  }, {
    detail: {
      summary: "Ambil Struktur Sidebar",
      description: "Mengambil menu dalam bentuk struktur pohon (Tree) sesuai hak akses user.",
      tags: ["Menus"]
    },
    beforeHandle: hasPermission("MENU_READ")
  })

  // 2. GET ALL MENUS (Flat list)
  .get("/all", async () => {
    const menus = await getMenusUseCase.execute();
    return {
      success: true,
      data: menus
    };
  }, {
    detail: {
      summary: "List Semua Menu (Flat)",
      description: "Mengambil semua menu dalam bentuk list datar tanpa filter permission.",
      tags: ["Menus"]
    },
    beforeHandle: hasPermission("MENU_ALL")
  })

  // 3. GET MENU BY ID
  .get("/:id", async ({ params: { id } }) => {
      const menu = await getMenuByIdUseCase.execute(id);
      return {
        success: true,
        data: menu
      };
    }, {
      detail: {
        summary: "Detail Menu",
        tags: ["Menus"]
      },
      beforeHandle: hasPermission("MENU_READ")
    }
  )

  // 4. CREATE MENU
  .post(
    "/",
    async ({ body, set }) => {
      const result = await createMenuUseCase.execute(body);
      set.status = 201;
      return {
        success: true,
        message: "Menu berhasil dibuat",
        data: result
      };
    },
    {
      beforeHandle: hasPermission("MENU_CREATE"),
      detail: {
        summary: "Membuat Menu Baru",
        tags: ["Menus"],
        description: "Endpoint ini digunakan untuk menambahkan menu atau sub-menu baru ke dalam sistem."
      },
      body: t.Object({
        label: t.String({ 
          description: "Label teks yang akan ditampilkan pada UI sidebar",
          examples: ["Manajemen User", "Dashboard Settings"]
        }),
        path: t.String({ 
          description: "Rute URL atau path navigasi menu",
          examples: ["/admin/users", "/dashboard"]
        }),
        icon: t.Optional(t.String({ 
          description: "Nama class icon (misal: FontAwesome atau Lucide)",
          examples: ["user-icon", "home"]
        })),
        order: t.Number({ 
          description: "Urutan tampilan menu (angka lebih kecil muncul lebih atas)",
          default: 0
        }),
        parentId: t.Optional(t.Nullable(t.String({ 
          description: "ID UUID dari menu induk jika ini adalah sub-menu" 
        }))),
        permissionId: t.Optional(t.Nullable(t.String({ 
          description: "ID UUID dari permission yang dibutuhkan untuk melihat menu ini" 
        }))),
      })
    }
  )

  // 5. UPDATE MENU
  .put(
    "/:id",
    async ({ params: { id }, body, set }) => {
      try {
        const result = await updateMenuUseCase.execute(id, body);
        return {
          success: true,
          message: "Menu berhasil diperbarui",
          data: result
        };
      } catch (error: any) {
        set.status = 400;
        if (error?.code === "P2003") {
          return { success: false, error: "PermissionId atau ParentId tidak valid." };
        }
        set.status = 404;
        return { success: false, error: error.message };
      }
    },
    {
      beforeHandle: hasPermission("MENU_UPDATE"),
      detail: {
        summary: "Memperbarui Data Menu",
        tags: ["Menus"],
        description: "Mengubah informasi menu berdasarkan ID. Field yang dikirim bersifat opsional."
      },
      body: t.Object({
        label: t.Optional(t.String({ description: "Label teks baru untuk menu" })),
        path: t.Optional(t.String({ description: "URL path baru" })),
        icon: t.Optional(t.String({ description: "Nama class icon baru" })),
        order: t.Optional(t.Number({ description: "Urutan tampilan baru" })),
        parentId: t.Optional(t.Nullable(t.String({ description: "ID Parent baru (UUID)" }))),
        permissionId: t.Optional(t.Nullable(t.String({ description: "ID Permission baru (UUID)" }))),
      })
    }
  )

  // 6. DELETE MENU
  .delete("/:id", async ({ params: { id }, set }) => {
    try {
      await deleteMenuUseCase.execute(id);
      return {
        success: true,
        message: "Menu berhasil dihapus"
      };
    } catch (error: any) {
      set.status = 404;
      return {
        success: false,
        error: error.message
      };
    }
  }, {
    detail: {
      summary: "Hapus Menu",
      tags: ["Menus"]
    },
    beforeHandle: hasPermission("MENU_DELETE")
  });