import type { IMenuRepository }
from "../../../domain/repositories/menu.repository";
import { menuSchemas } from "../../../domain/validators/menu.validator";

export class DeleteMenuUseCase {
  constructor(
    private menuRepo: IMenuRepository
  ) {}

  async execute(id: string) {
    // Validasi format UUID
    const { error } = menuSchemas.delete.validate({ id });
    if (error) {
      const errorMessage = error.details?.[0]?.message ?? "ID tidak valid";
      throw new Error(errorMessage);
    }

    const existing = await this.menuRepo.findById(id);
    if (!existing) {
      throw new Error("Menu tidak ditemukan atau sudah dihapus.");
    }

    return await this.menuRepo.delete(id);
  }
}