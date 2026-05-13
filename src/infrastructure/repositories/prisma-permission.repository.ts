import { db } from "../database/prisma-client";
import type { IPermissionRepository } from "../../domain/repositories/permission.repository";
import type { Permission } from "@prisma/client";

export class PrismaPermissionRepository implements IPermissionRepository {
  async findAll(): Promise<Permission[]> {
    return await db.permission.findMany();
  }

  async findById(id: string): Promise<Permission | null> {
    return await db.permission.findUnique({ where: { id } });
  }

  async create(name: string, description?: string): Promise<Permission> {
    return await db.permission.create({
      data: { name, description }
    });
  }

  // Ubah definisi fungsi agar menerima objek data, bukan argumen terpisah
 // src/infrastructure/repositories/prisma-role.repository.ts

// async update(id: string, data: { name?: string; description?: string; permissionIds?: string[] }) {
//   return await db.role.update({
//     where: { id },
//     data: {
//       name: data.name,
//       description: data.description,
//       // Logika sinkronisasi permissions
//       permissions: data.permissionIds ? {
//         deleteMany: {}, // Hapus semua izin lama untuk role ini
//         create: data.permissionIds.map((pId) => ({
//           permissionId: pId
//         })) // Tambahkan izin baru
//       } : undefined
//     },
//     include: {
//       permissions: {
//         include: {
//           permission: true
//         }
//       }
//     }
//   });
// }

async update(id: string, data: { name?: string; description?: string }): Promise<Permission> {
    return await db.permission.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description
      }
    });
  }

  async delete(id: string): Promise<void> {
    await db.permission.delete({ where: { id } });
  }
}