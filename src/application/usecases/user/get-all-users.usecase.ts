import type { IUserRepository } from "../../../domain/repositories/user.repository";

export class GetAllUsersUseCase {
  constructor(private userRepo: IUserRepository) {}

  async execute() {
    const users = await this.userRepo.findAll();

    // Mapping untuk membersihkan data (menghilangkan password)
    return users.map((user) => {
      const { password, ...userWithoutPassword } = user;
      
      // Mempercantik struktur roles agar lebih mudah dibaca di frontend
      // Dari: { roles: [ { role: { name: 'ADMIN' } } ] }
      // Menjadi: { roles: [ 'ADMIN' ] }
      return {
        ...userWithoutPassword,
        roles: user.roles.map((ur: any) => ur.role.name)
      };
    });
  }
}