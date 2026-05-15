import type { IMenuRepository }
from "../../../domain/repositories/menu.repository";

export class GetMenusUseCase {

  constructor(
    private menuRepo: IMenuRepository
  ) {}

  async execute() {
    return await this.menuRepo.findAll();
  }
}