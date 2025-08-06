/*
  Warnings:

  - You are about to drop the column `productId` on the `UserInterest` table. All the data in the column will be lost.
  - You are about to drop the column `serviceId` on the `UserInterest` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `UserInterest` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `UserInterest` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_UserInterest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "interestType" TEXT NOT NULL,
    "interestLevel" REAL NOT NULL DEFAULT 0,
    "source" TEXT NOT NULL,
    "metadata" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "websiteId" TEXT NOT NULL,
    "chatSessionId" TEXT,
    CONSTRAINT "UserInterest_websiteId_fkey" FOREIGN KEY ("websiteId") REFERENCES "Website" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "UserInterest_chatSessionId_fkey" FOREIGN KEY ("chatSessionId") REFERENCES "ChatSession" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_UserInterest" ("chatSessionId", "createdAt", "id", "interestLevel", "interestType", "metadata", "source", "websiteId") SELECT "chatSessionId", "createdAt", "id", "interestLevel", "interestType", "metadata", "source", "websiteId" FROM "UserInterest";
DROP TABLE "UserInterest";
ALTER TABLE "new_UserInterest" RENAME TO "UserInterest";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
