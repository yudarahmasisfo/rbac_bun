import type {
  Menu,
  Prisma,
} from "@prisma/client";

export interface IMenuRepository {

  // Sidebar menu berdasarkan permission
  findAllowedMenus(
    userPermissionIds: string[]
  ): Promise<Menu[]>;

  // CRUD
  findAll(): Promise<Menu[]>;

  findById(id: string): Promise<Menu | null>;

  create(
    data: Prisma.MenuCreateInput
  ): Promise<Menu>;

  update(
    id: string,
    data: Prisma.MenuUpdateInput
  ): Promise<Menu>;

  delete(id: string): Promise<Menu>;
}