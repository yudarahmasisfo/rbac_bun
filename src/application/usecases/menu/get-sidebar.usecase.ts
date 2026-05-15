import { MenuRepository } from "../../../infrastructure/repositories/menu.repository";
import { listToTree } from "../../helpers/tree.helper";

export class GetSidebarUseCase {
  constructor(private menuRepo: MenuRepository) {}

  async execute(permissions: string[]) {
    // 1. Ambil data flat dari DB (Performa Cepat)
    const rawMenus = await this.menuRepo.findAllowedMenus(permissions);
    
    // 2. Ubah jadi struktur pohon untuk Frontend (Clean)
    return listToTree(rawMenus);
  }
}