import { db } from "../ database/prisma-client";
import type { IRoleRepository } from "../../ domain/ repositories/role.repository";
import type { Role } from "@prisma/client";

export class PrismaRoleRepository implements IRoleRepository {
  async findAll(): Promise<Role[]> {
    return await db.role.findMany({
      include: { permissions: { include: { permission: true } } }
    });
  }

  async findById(id: string): Promise<Role | null> {
    return await db.role.findUnique({
      where: { id },
      include: { permissions: { include: { permission: true } } }
    });
  }

  async create(name: string, description: string | undefined, permissionIds: string[]): Promise<Role> {
    return await db.role.create({
      data: {
        name,
        description,
        permissions: {
          create: permissionIds.map(pId => ({
            permission: { connect: { id: pId } }
          }))
        }
      }
    });
  }

  async update(id: string, data: { name?: string; description?: string; permissionIds?: string[] }): Promise<Role> {
    return await db.role.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        permissions: data.permissionIds ? {
          deleteMany: {}, // Hapus relasi lama
          create: data.permissionIds.map(pId => ({
            permission: { connect: { id: pId } }
          }))
        } : undefined
      }
    });
  }

  async delete(id: string): Promise<void> {
    await db.role.delete({ where: { id } });
  }
}