import type { User } from "@prisma/client";

export interface IUserRepository {
  findAll(): Promise<any[]>;
  findById(id: string): Promise<any | null>;
  findByEmail(email: string): Promise<User | null>;
  findByUsername(username: string): Promise<User | null>;
  create(data: any): Promise<User>;
  update(id: string, data: any): Promise<User>;
  delete(id: string): Promise<void>;
}