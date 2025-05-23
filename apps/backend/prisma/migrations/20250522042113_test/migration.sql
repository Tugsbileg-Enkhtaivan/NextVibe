/*
  Warnings:

  - You are about to drop the `History` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Mood` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Profile` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `User` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "MoodType" AS ENUM ('HAPPY', 'SAD', 'ENERGETIC', 'CALM', 'ANGRY', 'ROMANTIC', 'NOSTALGIC', 'FOCUSED', 'PARTY', 'CHILL', 'WORKOUT', 'MELANCHOLIC');

-- CreateEnum
CREATE TYPE "EnergyLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateEnum
CREATE TYPE "ValenceLevel" AS ENUM ('NEGATIVE', 'NEUTRAL', 'POSITIVE');

-- CreateEnum
CREATE TYPE "RecommendationType" AS ENUM ('MOOD_BASED', 'ACTIVITY_BASED', 'SIMILAR_TO_TRACK', 'SIMILAR_TO_ARTIST', 'DISCOVERY', 'DAILY_MIX');

-- CreateEnum
CREATE TYPE "FavoriteType" AS ENUM ('TRACK', 'ALBUM', 'ARTIST', 'PLAYLIST');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "Platform" ADD VALUE 'APPLE_MUSIC';
ALTER TYPE "Platform" ADD VALUE 'SOUNDCLOUD';

-- DropForeignKey
ALTER TABLE "History" DROP CONSTRAINT "History_userId_fkey";

-- DropForeignKey
ALTER TABLE "Mood" DROP CONSTRAINT "Mood_userId_fkey";

-- DropForeignKey
ALTER TABLE "Profile" DROP CONSTRAINT "Profile_userId_fkey";

-- DropTable
DROP TABLE "History";

-- DropTable
DROP TABLE "Mood";

-- DropTable
DROP TABLE "Profile";

-- DropTable
DROP TABLE "User";

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "mbti" TEXT,
    "astrology" TEXT,
    "avatar" TEXT,
    "bio" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "spotify_accounts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "spotifyId" TEXT NOT NULL,
    "displayName" TEXT,
    "email" TEXT,
    "country" TEXT,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "spotify_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "listening_history" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "trackId" TEXT NOT NULL,
    "albumId" TEXT,
    "artistIds" TEXT[],
    "platform" "Platform" NOT NULL DEFAULT 'SPOTIFY',
    "playedAt" TIMESTAMP(3) NOT NULL,
    "msPlayed" INTEGER,
    "context" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "trackName" TEXT NOT NULL,
    "artistNames" TEXT[],
    "albumName" TEXT,
    "imageUrl" TEXT,
    "previewUrl" TEXT,
    "duration" INTEGER,

    CONSTRAINT "listening_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mood_entries" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "mood" "MoodType" NOT NULL,
    "energy" "EnergyLevel" NOT NULL,
    "valence" "ValenceLevel" NOT NULL,
    "genres" TEXT[],
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mood_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recommendations" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "RecommendationType" NOT NULL,
    "mood" "MoodType",
    "energy" "EnergyLevel",
    "valence" "ValenceLevel",
    "genres" TEXT[],
    "seedTracks" TEXT[],
    "seedArtists" TEXT[],
    "parameters" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "recommendations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recommended_tracks" (
    "id" TEXT NOT NULL,
    "recommendationId" TEXT NOT NULL,
    "trackId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "artistNames" TEXT[],
    "albumName" TEXT,
    "imageUrl" TEXT,
    "previewUrl" TEXT,
    "duration" INTEGER,
    "popularity" INTEGER,

    CONSTRAINT "recommended_tracks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recommended_albums" (
    "id" TEXT NOT NULL,
    "recommendationId" TEXT NOT NULL,
    "albumId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "artistNames" TEXT[],
    "imageUrl" TEXT,
    "releaseDate" TEXT,
    "totalTracks" INTEGER,

    CONSTRAINT "recommended_albums_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "favorites" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "FavoriteType" NOT NULL,
    "itemId" TEXT NOT NULL,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "name" TEXT NOT NULL,
    "artistNames" TEXT[],
    "imageUrl" TEXT,
    "metadata" JSONB,

    CONSTRAINT "favorites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "playlists" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "imageUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "playlists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "playlist_tracks" (
    "id" TEXT NOT NULL,
    "playlistId" TEXT NOT NULL,
    "trackId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "addedBy" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "artistNames" TEXT[],
    "albumName" TEXT,
    "imageUrl" TEXT,
    "previewUrl" TEXT,
    "duration" INTEGER,

    CONSTRAINT "playlist_tracks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "profiles_userId_key" ON "profiles"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "spotify_accounts_userId_key" ON "spotify_accounts"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "spotify_accounts_spotifyId_key" ON "spotify_accounts"("spotifyId");

-- CreateIndex
CREATE INDEX "listening_history_userId_playedAt_idx" ON "listening_history"("userId", "playedAt");

-- CreateIndex
CREATE INDEX "listening_history_trackId_idx" ON "listening_history"("trackId");

-- CreateIndex
CREATE INDEX "mood_entries_userId_createdAt_idx" ON "mood_entries"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "recommendations_userId_createdAt_idx" ON "recommendations"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "recommended_tracks_recommendationId_position_key" ON "recommended_tracks"("recommendationId", "position");

-- CreateIndex
CREATE UNIQUE INDEX "recommended_albums_recommendationId_position_key" ON "recommended_albums"("recommendationId", "position");

-- CreateIndex
CREATE INDEX "favorites_userId_type_idx" ON "favorites"("userId", "type");

-- CreateIndex
CREATE UNIQUE INDEX "favorites_userId_itemId_type_key" ON "favorites"("userId", "itemId", "type");

-- CreateIndex
CREATE INDEX "playlists_userId_idx" ON "playlists"("userId");

-- CreateIndex
CREATE INDEX "playlist_tracks_trackId_idx" ON "playlist_tracks"("trackId");

-- CreateIndex
CREATE UNIQUE INDEX "playlist_tracks_playlistId_position_key" ON "playlist_tracks"("playlistId", "position");

-- AddForeignKey
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "spotify_accounts" ADD CONSTRAINT "spotify_accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "listening_history" ADD CONSTRAINT "listening_history_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mood_entries" ADD CONSTRAINT "mood_entries_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recommendations" ADD CONSTRAINT "recommendations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recommended_tracks" ADD CONSTRAINT "recommended_tracks_recommendationId_fkey" FOREIGN KEY ("recommendationId") REFERENCES "recommendations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recommended_albums" ADD CONSTRAINT "recommended_albums_recommendationId_fkey" FOREIGN KEY ("recommendationId") REFERENCES "recommendations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "playlists" ADD CONSTRAINT "playlists_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "playlist_tracks" ADD CONSTRAINT "playlist_tracks_playlistId_fkey" FOREIGN KEY ("playlistId") REFERENCES "playlists"("id") ON DELETE CASCADE ON UPDATE CASCADE;
