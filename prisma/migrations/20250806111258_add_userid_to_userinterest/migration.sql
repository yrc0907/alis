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
    "userId" TEXT,
    "chatSessionId" TEXT,
    CONSTRAINT "UserInterest_websiteId_fkey" FOREIGN KEY ("websiteId") REFERENCES "Website" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "UserInterest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "UserInterest_chatSessionId_fkey" FOREIGN KEY ("chatSessionId") REFERENCES "ChatSession" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_UserInterest" ("chatSessionId", "createdAt", "id", "interestLevel", "interestType", "metadata", "source", "websiteId") SELECT "chatSessionId", "createdAt", "id", "interestLevel", "interestType", "metadata", "source", "websiteId" FROM "UserInterest";
DROP TABLE "UserInterest";
ALTER TABLE "new_UserInterest" RENAME TO "UserInterest";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
