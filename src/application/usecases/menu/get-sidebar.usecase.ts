import type { IMenuRepository } from "../../../domain/repositories/menu.repository";
import { listToTree } from "../../helpers/tree.helper";

export class GetSidebarUseCase {
  constructor(private menuRepo: IMenuRepository) {}

  async execute(permissions: string[], isSuperAdmin: boolean = false) {
    // 1. Jika Superadmin, ambil semua menu. Jika bukan, filter berdasarkan permission.
    const rawMenus = isSuperAdmin 
      ? await this.menuRepo.findAll() 
      : await this.menuRepo.findAllowedMenus(permissions);
    
    // 2. Ubah jadi struktur pohon untuk Frontend (Clean)
    return listToTree(rawMenus);
  }
}