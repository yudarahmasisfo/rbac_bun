import { db } from "../database/prisma-client";
import type { IUserRepository } from "../../domain/repositories/user.repository";
import type { User } from "@prisma/client";

export class PrismaUserRepository implements IUserRepository {
  async findAll(isActive?: boolean): Promise<any[]> {
    return await db.user.findMany({
      where: isActive !== undefined ? { isActive } : {},
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

  
  async create(data: { username: string; email: string; name: string; photo?: string; password: string; roleIds: string[]; isActive?: boolean }): Promise<User> {
    try {
      // Jika photo tidak ada, gunakan default UI Avatars berdasarkan nama
      const defaultPhoto = `https://ui-avatars.com/api/?name=${encodeURIComponent(data.name || data.username)}&background=random&color=fff`;

      return await db.user.create({
        data: {
          username: data.username,
          email: data.email,
          name: data.name,
          photo: data.photo || defaultPhoto,
          password: data.password,
          isActive: data.isActive ?? false,
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
      // Tangkap error relasi ID Role tidak ditemukan (P2003)
      if (error.code === 'P2003' || error.message?.includes("foreign key constraint")) {
        throw new Error("Satu atau lebih Role ID tidak valid atau tidak ditemukan di sistem.");
      }
      throw error;
    }
  }

  async update(id: string, data: { username?: string; email?: string; name?: string; photo?: string; password?: string; roleIds?: string[]; isActive?: boolean }): Promise<User> {
    try {
      return await db.user.update({
        where: { id },
        data: {
          username: data.username,
          email: data.email,
          name: data.name,
          photo: data.photo,
          password: data.password,
          isActive: data.isActive,
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
      // Tangkap error relasi ID Role tidak ditemukan
      if (error.code === 'P2003' || error.message?.includes("foreign key constraint")) {
        throw new Error("Gagal update: Satu atau lebih Role ID tidak ditemukan.");
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