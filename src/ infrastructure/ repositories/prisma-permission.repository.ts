import { db } from "../ database/prisma-client";
import { IPermissionRepository } from '../../ domain/ repositories/permission.repository';

export class PrismaPermissionRepository implements IPermissionRepository {
  async findAll() {
    return await db.permission.findMany();
  }
  async create(name: string, description?: string) {
    return await db.permission.create({ data: { name, description } });
  }
}