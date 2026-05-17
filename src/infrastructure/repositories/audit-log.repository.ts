import { db } from "../database/prisma-client";

export interface CreateAuditLogInput {
  userId?: string;
  username?: string;
  action: string;
  resource: string;
  targetId?: string | null;
  payload?: string;
}

export class AuditLogRepository {
  async create(data: CreateAuditLogInput) {
    // Pastikan model AuditLog sudah ada di schema.prisma Anda
    return await db.auditLog.create({
      data: {
        ...data,
      },
    });
  }
}