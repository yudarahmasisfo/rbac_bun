import type { User } from "@prisma/client";

export interface IUserRepository {
  findAll(): Promise<any[]>;
  findById(id: string): Promise<any | null>;
  findByEmail(email: string): Promise<User | null>;
  findByUsername(username: string): Promise<User | null>;
  create(data: { username: string; email: string; password: string; roleIds: string[] }): Promise<User>;
  update(id: string, data: { username?: string; email?: string; password?: string; roleIds?: string[] }): Promise<User>;
  delete(id: string): Promise<void>;
}