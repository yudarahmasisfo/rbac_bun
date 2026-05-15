import type { IMenuRepository }
from "../../../domain/repositories/menu.repository";

export class GetMenuByIdUseCase {

  constructor(
    private menuRepo: IMenuRepository
  ) {}

  async execute(id: string) {

    const menu =
      await this.menuRepo.findById(id);

    if (!menu) {
      throw new Error("Menu tidak ditemukan");
    }

    return menu;
  }
}