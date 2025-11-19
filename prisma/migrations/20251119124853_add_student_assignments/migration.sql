-- CreateTable
CREATE TABLE "StudentAssignment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "assignmentId" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StudentAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentQuizAssignment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "quizId" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StudentQuizAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentMaterialAssignment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "materialId" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StudentMaterialAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "StudentAssignment_userId_assignmentId_key" ON "StudentAssignment"("userId", "assignmentId");

-- CreateIndex
CREATE INDEX "StudentAssignment_userId_idx" ON "StudentAssignment"("userId");

-- CreateIndex
CREATE INDEX "StudentAssignment_assignmentId_idx" ON "StudentAssignment"("assignmentId");

-- CreateIndex
CREATE UNIQUE INDEX "StudentQuizAssignment_userId_quizId_key" ON "StudentQuizAssignment"("userId", "quizId");

-- CreateIndex
CREATE INDEX "StudentQuizAssignment_userId_idx" ON "StudentQuizAssignment"("userId");

-- CreateIndex
CREATE INDEX "StudentQuizAssignment_quizId_idx" ON "StudentQuizAssignment"("quizId");

-- CreateIndex
CREATE UNIQUE INDEX "StudentMaterialAssignment_userId_materialId_key" ON "StudentMaterialAssignment"("userId", "materialId");

-- CreateIndex
CREATE INDEX "StudentMaterialAssignment_userId_idx" ON "StudentMaterialAssignment"("userId");

-- CreateIndex
CREATE INDEX "StudentMaterialAssignment_materialId_idx" ON "StudentMaterialAssignment"("materialId");

-- AddForeignKey
ALTER TABLE "StudentAssignment" ADD CONSTRAINT "StudentAssignment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentAssignment" ADD CONSTRAINT "StudentAssignment_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "Assignment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentQuizAssignment" ADD CONSTRAINT "StudentQuizAssignment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentQuizAssignment" ADD CONSTRAINT "StudentQuizAssignment_quizId_fkey" FOREIGN KEY ("quizId") REFERENCES "Quiz"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentMaterialAssignment" ADD CONSTRAINT "StudentMaterialAssignment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentMaterialAssignment" ADD CONSTRAINT "StudentMaterialAssignment_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "CourseMaterial"("id") ON DELETE CASCADE ON UPDATE CASCADE;

