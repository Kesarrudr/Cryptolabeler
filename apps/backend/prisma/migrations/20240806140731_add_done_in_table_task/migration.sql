-- AlterTable
ALTER TABLE "Task" ADD COLUMN     "done" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Worker" ALTER COLUMN "pending_amount" SET DEFAULT 0,
ALTER COLUMN "locket_amount" SET DEFAULT 0;
