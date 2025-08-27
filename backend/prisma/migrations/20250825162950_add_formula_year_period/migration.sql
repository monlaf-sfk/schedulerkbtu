/*
  Warnings:

  - Added the required column `formula` to the `Course` table without a default value. This is not possible if the table is not empty.
  - Added the required column `period` to the `Course` table without a default value. This is not possible if the table is not empty.
  - Added the required column `year` to the `Course` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Course" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "credits" INTEGER NOT NULL,
    "formula" TEXT NOT NULL,
    "year" TEXT NOT NULL,
    "period" TEXT NOT NULL
);
INSERT INTO "new_Course" ("code", "credits", "id", "name") SELECT "code", "credits", "id", "name" FROM "Course";
DROP TABLE "Course";
ALTER TABLE "new_Course" RENAME TO "Course";
CREATE UNIQUE INDEX "Course_code_key" ON "Course"("code");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
