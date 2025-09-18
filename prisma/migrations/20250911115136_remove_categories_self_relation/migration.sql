/*
  Warnings:

  - You are about to drop the column `parent_id` on the `categories` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."categories" DROP CONSTRAINT "categories_parent_id_fkey";

-- AlterTable
ALTER TABLE "public"."categories" DROP COLUMN "parent_id";
