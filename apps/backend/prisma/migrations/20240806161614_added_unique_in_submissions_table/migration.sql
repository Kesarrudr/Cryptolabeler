/*
  Warnings:

  - A unique constraint covering the columns `[workerId,tasksId]` on the table `Submissions` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Submissions_workerId_tasksId_key" ON "Submissions"("workerId", "tasksId");
