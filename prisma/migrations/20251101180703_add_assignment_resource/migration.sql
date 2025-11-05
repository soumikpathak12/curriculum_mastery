-- CreateTable
CREATE TABLE "public"."AssignmentResource" (
    "id" TEXT NOT NULL,
    "assignmentId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" "public"."ResourceType" NOT NULL,
    "fileKey" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AssignmentResource_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AssignmentResource_assignmentId_idx" ON "public"."AssignmentResource"("assignmentId");

-- AddForeignKey
ALTER TABLE "public"."AssignmentResource" ADD CONSTRAINT "AssignmentResource_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "public"."Assignment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

