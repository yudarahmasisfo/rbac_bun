import { db } from "../database/prisma-client";
import type { IUserRepository } from "../../domain/repositories/user.repository";
import type { User } from "@prisma/client";

export class PrismaUserRepository implements IUserRepository {
  async findAll(): Promise<any[]> {
    return await db.user.findMany({
      include: {
        roles: {
          include: {
            role: {
              include: {
                permissions: {
                  include: {
                    permission: true
                  }
                }
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async findById(id: string) {
    return await db.user.findUnique({
      where: { id },
      include: {
        // PERBAIKAN: Mengganti 'role' menjadi 'roles' sesuai skema Prisma dan menambahkan include untuk permissions
        roles: {
          include: {
            role: {
              include: {
                permissions: {
                  include: {
                    permission: true
                  }
                }
              }
            }
          }
        }
      }
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return await db.user.findUnique({ where: { email } });
  }

  async findByUsername(username: string) {
    return await db.user.findUnique({
      where: { username },
      include: {
        roles: {
          include: {
            role: {
              include: {
                permissions: {
                  include: {
                    permission: true
                  }
                }
              }
            }
          }
        }
      }
    });
  }

  
  async create(data: { username: string; email: string; name: string; password: string; roleIds: string[] }): Promise<User> {
    try {
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
    } catch (error: any) {
      if (error.code === 'P2002') {
        throw new Error("Email atau Username sudah terdaftar.");
      }
      throw error;
    }
  }

  async update(id: string, data: { username?: string; email?: string; name?: string; password?: string; roleIds?: string[] }): Promise<User> {
    try {
      return await db.user.update({
        where: { id },
        data: {
          username: data.username,
          email: data.email,
          name: data.name,
          password: data.password,
          roles: data.roleIds ? {
            deleteMany: {}, // Menghapus relasi lama di tabel UserRole
            create: data.roleIds.map((rId) => ({
              roleId: rId
            }))
          } : undefined
        }
      });
    } catch (error: any) {
      if (error.code === 'P2002') {
        throw new Error("Gagal update: Email atau Username sudah digunakan.");
      }
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    try {
      // PERBAIKAN: Gunakan 'userRole' sesuai nama model di schema.prisma
      await db.userRole.deleteMany({ 
        where: { userId: id } 
      });

      await db.user.delete({ 
        where: { id } 
      });
    } catch (error) {
      throw new Error("Gagal menghapus user, ID tidak ditemukan.");
    }
  }
}