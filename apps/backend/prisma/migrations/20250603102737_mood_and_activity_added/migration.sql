-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "ActivityType" ADD VALUE 'NOTHING';
ALTER TYPE "ActivityType" ADD VALUE 'DRAWING';
ALTER TYPE "ActivityType" ADD VALUE 'YOGA';
ALTER TYPE "ActivityType" ADD VALUE 'BIKING';
ALTER TYPE "ActivityType" ADD VALUE 'GARDENING';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "MoodType" ADD VALUE 'ANGER';
ALTER TYPE "MoodType" ADD VALUE 'ENVY';
ALTER TYPE "MoodType" ADD VALUE 'FEAR';
ALTER TYPE "MoodType" ADD VALUE 'SADNESS';
ALTER TYPE "MoodType" ADD VALUE 'ENNUI';
ALTER TYPE "MoodType" ADD VALUE 'DISGUST';
ALTER TYPE "MoodType" ADD VALUE 'SHAME';
ALTER TYPE "MoodType" ADD VALUE 'ANXIETY';
