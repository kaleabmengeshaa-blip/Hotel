ALTER TABLE "MenuSettings"
ALTER COLUMN "newestDishesFirst" SET DEFAULT true;

-- Enable newest-first ordering for existing installations on the feature's first rollout.
UPDATE "MenuSettings"
SET "newestDishesFirst" = true
WHERE "newestDishesFirst" = false;
