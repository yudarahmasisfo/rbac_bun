import type { Prisma }
from "@prisma/client";

import type { IMenuRepository }
from "../../../domain/repositories/menu.repository";
import { menuSchemas } from "../../../domain/validators/menu.validator";

export class CreateMenuUseCase {
  constructor(
    private menuRepo: IMenuRepository
  ) {}

  async execute(input: any) {
    const { error, value } = menuSchemas.create.validate(input, {
      abortEarly: false,
      stripUnknown: true
    });
    
    if (error) {
      const errorMessage = error.details?.[0]?.message ?? "Validasi gagal";
      throw new Error(errorMessage);
    }

    return await this.menuRepo.create(value as Prisma.MenuCreateInput);
  }
}