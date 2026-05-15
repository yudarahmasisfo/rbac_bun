import { db } from "../database/prisma-client";
import type { Menu, Prisma } from "@prisma/client";

export class MenuRepository {
  async findAllowedMenus(userPermissionIds: string[]): Promise<Menu[]> {
    // Kita definisikan query filter secara eksplisit
    const whereCondition: Prisma.MenuWhereInput = {
      OR: [
        { permissionId: null },
        {
          permissionId: {
            in: userPermissionIds.length > 0 ? userPermissionIds : ["NONE"],
          },
        },
      ],
    };

    return await db.menu.findMany({
      where: whereCondition,
      orderBy: { order: "asc" },
    });
  }
}