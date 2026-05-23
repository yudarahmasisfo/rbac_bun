import type { User } from "@prisma/client";

export interface IUserRepository {
  findAll(isActive?: boolean): Promise<any[]>;
  findById(id: string): Promise<any | null>;
  findByEmail(email: string): Promise<User | null>;
  findByUsername(username: string): Promise<User | null>;
  create(data: { username: string; email: string; name: string; photo?: string; password: string; roleIds: string[]; isActive?: boolean }): Promise<User>;
  update(id: string, data: { username?: string; email?: string; name?: string; photo?: string; password?: string; roleIds?: string[]; isActive?: boolean }): Promise<User>;
  delete(id: string): Promise<void>;
}