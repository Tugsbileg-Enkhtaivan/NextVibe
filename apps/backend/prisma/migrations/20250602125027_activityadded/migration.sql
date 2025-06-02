-- CreateEnum
CREATE TYPE "ActivityType" AS ENUM ('WORKOUT', 'STUDY', 'WORK', 'PARTY', 'RELAX', 'COMMUTE', 'COOKING', 'CLEANING', 'SLEEP', 'MEDITATION', 'READING', 'GAMING', 'SOCIALIZING', 'TRAVELING', 'SHOPPING', 'DATING', 'DANCING', 'RUNNING', 'WALKING', 'GYM');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "MoodType" ADD VALUE 'EXCITED';
ALTER TYPE "MoodType" ADD VALUE 'RELAXED';
ALTER TYPE "MoodType" ADD VALUE 'PEACEFUL';
ALTER TYPE "MoodType" ADD VALUE 'UPBEAT';

-- AlterEnum
ALTER TYPE "RecommendationType" ADD VALUE 'MOOD_ACTIVITY_BASED';

-- AlterTable
ALTER TABLE "recommendations" ADD COLUMN     "activity" "ActivityType";

-- CreateTable
CREATE TABLE "activity_entries" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "activity" "ActivityType" NOT NULL,
    "duration" INTEGER,
    "energy" "EnergyLevel" NOT NULL,
    "context" TEXT,
    "location" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activity_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mood_activity_entries" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "mood" "MoodType" NOT NULL,
    "activity" "ActivityType" NOT NULL,
    "energy" "EnergyLevel" NOT NULL,
    "valence" "ValenceLevel" NOT NULL,
    "genres" TEXT[],
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mood_activity_entries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "activity_entries_userId_createdAt_idx" ON "activity_entries"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "mood_activity_entries_userId_createdAt_idx" ON "mood_activity_entries"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "mood_activity_entries_userId_mood_activity_idx" ON "mood_activity_entries"("userId", "mood", "activity");

-- CreateIndex
CREATE INDEX "recommendations_userId_mood_activity_idx" ON "recommendations"("userId", "mood", "activity");

-- AddForeignKey
ALTER TABLE "activity_entries" ADD CONSTRAINT "activity_entries_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mood_activity_entries" ADD CONSTRAINT "mood_activity_entries_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
