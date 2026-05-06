import type { Permission } from "@prisma/client";

export interface IPermissionRepository {
  findAll(): Promise<Permission[]>;
  findById(id: string): Promise<Permission | null>;
  create(name: string, description?: string): Promise<Permission>;
  update(id: string, data: { name?: string; description?: string }): Promise<Permission>;
  delete(id: string): Promise<void>;
}