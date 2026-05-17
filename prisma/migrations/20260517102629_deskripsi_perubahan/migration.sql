/*
  Warnings:

  - You are about to drop the column `permissionName` on the `Menu` table. All the data in the column will be lost.
  - Added the required column `updatedAt` to the `Menu` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `Menu` DROP COLUMN `permissionName`,
    ADD COLUMN `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `permissionId` VARCHAR(191) NULL,
    ADD COLUMN `updatedAt` DATETIME(3) NOT NULL;

-- CreateTable
CREATE TABLE `AuditLog` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NULL,
    `username` VARCHAR(191) NULL,
    `action` VARCHAR(191) NOT NULL,
    `resource` VARCHAR(191) NOT NULL,
    `targetId` VARCHAR(191) NULL,
    `payload` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `AuditLog_userId_idx`(`userId`),
    INDEX `AuditLog_resource_idx`(`resource`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Menu` ADD CONSTRAINT `Menu_permissionId_fkey` FOREIGN KEY (`permissionId`) REFERENCES `Permission`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
