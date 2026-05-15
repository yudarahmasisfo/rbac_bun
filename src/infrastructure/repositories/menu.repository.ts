import { db } from "../database/prisma-client";

import type {
  Menu,
  Prisma,
} from "@prisma/client";

import type {
  IMenuRepository,
} from "../../domain/repositories/menu.repository";

export class MenuRepository
  implements IMenuRepository {

  async findAllowedMenus(
    userPermissionIds: string[]
  ): Promise<Menu[]> {

    const whereCondition: Prisma.MenuWhereInput = {
      OR: [
        {
          permissionId: null,
        },
        {
          permissionId: {
            in:
              userPermissionIds.length > 0
                ? userPermissionIds
                : ["NONE"],
          },
        },
      ],
    };

    return await db.menu.findMany({
      where: whereCondition,

      orderBy: {
        order: "asc",
      },
    });
  }

  async findAll(): Promise<Menu[]> {

    return await db.menu.findMany({
      orderBy: {
        order: "asc",
      },
    });
  }

  async findById(
    id: string
  ): Promise<Menu | null> {

    return await db.menu.findUnique({
      where: { id },
    });
  }

  async create(
    data: Prisma.MenuCreateInput
  ): Promise<Menu> {

    return await db.menu.create({
      data,
    });
  }

  async update(
    id: string,
    data: Prisma.MenuUpdateInput
  ): Promise<Menu> {

    return await db.menu.update({
      where: { id },
      data,
    });
  }

  async delete(
    id: string
  ): Promise<Menu> {

    return await db.menu.delete({
      where: { id },
    });
  }
}