import type { Prisma }
from "@prisma/client";

import type { IMenuRepository }
from "../../../domain/repositories/menu.repository";
import { menuSchemas } from "../../../domain/validators/menu.validator";

export class UpdateMenuUseCase {
  constructor(
    private menuRepo: IMenuRepository
  ) {}

  async execute(
    id: string,
    input: any
  ) {
    // 1. Validasi ID dan Body
    const { error, value } = menuSchemas.update.validate(input, {
      abortEarly: false,
      stripUnknown: true
    });
    if (error) {
      const errorMessage = error.details?.[0]?.message ?? "Validasi gagal";
      throw new Error(errorMessage);
    }

    // 2. Cek keberadaan data
    const existing = await this.menuRepo.findById(id);
    if (!existing) {
      throw new Error("Menu tidak ditemukan.");
    }

    return await this.menuRepo.update(
      id,
      value as Prisma.MenuUpdateInput
    );
  }
}