/*
  Warnings:

  - The values [WORKOUT] on the enum `MoodType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "MoodType_new" AS ENUM ('HAPPY', 'SAD', 'ENERGETIC', 'CALM', 'ANGRY', 'ROMANTIC', 'NOSTALGIC', 'FOCUSED', 'PARTY', 'CHILL', 'MELANCHOLIC', 'VERY_HAPPY');
ALTER TABLE "mood_entries" ALTER COLUMN "mood" TYPE "MoodType_new" USING ("mood"::text::"MoodType_new");
ALTER TABLE "recommendations" ALTER COLUMN "mood" TYPE "MoodType_new" USING ("mood"::text::"MoodType_new");
ALTER TYPE "MoodType" RENAME TO "MoodType_old";
ALTER TYPE "MoodType_new" RENAME TO "MoodType";
DROP TYPE "MoodType_old";
COMMIT;
