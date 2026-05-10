import { db } from "../ database/prisma-client";
import type { IUserRepository } from "../../ domain/ repositories/user.repository";
import type { User } from "@prisma/client";

export class PrismaUserRepository implements IUserRepository {
  async findAll(): Promise<any[]> {
    return await db.user.findMany({
      include: {
        roles: {
          include: {
            role: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async findById(id: string): Promise<any | null> {
    return await db.user.findUnique({
      where: { id },
      include: {
        roles: {
          include: {
            role: true
          }
        }
      }
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return await db.user.findUnique({ where: { email } });
  }

  async findByUsername(username: string): Promise<User | null> {
    return await db.user.findUnique({ where: { username } });
  }

  async create(data: { username: string; email: string; name: string; password: string; roleIds: string[] }): Promise<User> {
    return await db.user.create({
      data: {
        username: data.username,
        email: data.email,
        name: data.name,
        password: data.password,
        roles: {
          create: data.roleIds.map((rId) => ({
            roleId: rId
          }))
        }
      }
    });
  }

  async update(id: string, data: { username?: string; email?: string; name?: string; password?: string; roleIds?: string[] }): Promise<User> {
    return await db.user.update({
      where: { id },
      data: {
        username: data.username,
        email: data.email,
        name: data.name,
        password: data.password,
        roles: data.roleIds ? {
          // Hapus semua relasi role yang lama terlebih dahulu
          deleteMany: {},
          // Buat relasi role yang baru (Sync)
          create: data.roleIds.map((rId) => ({
            roleId: rId
          }))
        } : undefined
      }
    });
  }

  async delete(id: string): Promise<void> {
    await db.user.delete({ where: { id } });
  }
}