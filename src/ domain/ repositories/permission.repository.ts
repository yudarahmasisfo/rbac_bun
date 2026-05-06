import { Permission } from "@prisma/client";
export interface IPermissionRepository {
  findAll(): Promise<any[]>;
  create(name: string, description?: string): Promise<any>;
}