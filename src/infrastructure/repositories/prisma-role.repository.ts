import { db } from "../database/prisma-client";
import type { IRoleRepository } from "../../domain/repositories/role.repository";
import type { Role } from "@prisma/client";

export class PrismaRoleRepository implements IRoleRepository {
  async findAll(): Promise<Role[]> {
    return await db.role.findMany({
      include: { permissions: { include: { permission: true } } }
    });
  }

  // Pastikan di prisma-role.repository.ts bagian findById seperti ini:
  async findById(id: string): Promise<Role | null> {
    return await db.role.findUnique({
      where: { id },
      include: {
       permissions: {
          include: {
            permission: true // Agar data permission (name, desc) ikut terbawa
          }
        }
      }
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

// src/infrastructure/repositories/prisma-role.repository.ts

async update(id: string, data: { name?: string; description?: string; permissionIds?: string[] }): Promise<Role> {
  try {
    return await db.role.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        permissions: data.permissionIds ? {
          deleteMany: {},
          create: data.permissionIds.map(pId => ({
            permission: { connect: { id: pId } }
          }))
        } : undefined
      },
      include: {
        permissions: { include: { permission: true } }
      }
    });
  } catch (error: any) {
    // Tangkap error Unique Constraint Prisma (P2002)
    if (error.code === 'P2002') {
      throw new Error("Gagal update: Nama role sudah ada di database.");
    }
    // Tangkap error Permission ID tidak ditemukan
    if (error.message?.includes("nested connect")) {
      throw new Error("Beberapa Permission ID yang Anda masukkan tidak valid atau tidak ditemukan.");
    }
    throw error;
  }
}

  async delete(id: string): Promise<void> {
    await db.role.delete({ where: { id } });
  }
}