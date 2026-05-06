import type { Role } from "@prisma/client";

export interface IRoleRepository {
  findAll(): Promise<Role[]>;
  findById(id: string): Promise<Role | null>;
  create(name: string, description: string | undefined, permissionIds: string[]): Promise<Role>;
  update(id: string, data: { name?: string; description?: string; permissionIds?: string[] }): Promise<Role>;
  delete(id: string): Promise<void>;
}