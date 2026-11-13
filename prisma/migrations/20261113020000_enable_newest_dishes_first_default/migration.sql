ALTER TABLE "MenuSettings"
ALTER COLUMN "newestDishesFirst" SET DEFAULT true;

UPDATE "MenuSettings"
SET "newestDishesFirst" = true
WHERE "newestDishesFirst" = false;
