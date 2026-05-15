import type { IMenuRepository }
from "../../../domain/repositories/menu.repository";

export class DeleteMenuUseCase {

  constructor(
    private menuRepo: IMenuRepository
  ) {}

  async execute(id: string) {

    return await this.menuRepo.delete(id);
  }
}