import type { Prisma }
from "@prisma/client";

import type { IMenuRepository }
from "../../../domain/repositories/menu.repository";

export class UpdateMenuUseCase {

  constructor(
    private menuRepo: IMenuRepository
  ) {}

  async execute(
    id: string,
    data: Prisma.MenuUpdateInput
  ) {

    return await this.menuRepo.update(
      id,
      data
    );
  }
}