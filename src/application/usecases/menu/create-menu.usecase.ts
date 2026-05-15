import type { Prisma }
from "@prisma/client";

import type { IMenuRepository }
from "../../../domain/repositories/menu.repository";

export class CreateMenuUseCase {

  constructor(
    private menuRepo: IMenuRepository
  ) {}

  async execute(
    data: Prisma.MenuCreateInput
  ) {

    return await this.menuRepo.create(data);
  }
}