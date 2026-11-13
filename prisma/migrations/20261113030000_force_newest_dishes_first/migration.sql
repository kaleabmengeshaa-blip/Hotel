-- Enforce newest-first ordering for existing and newly initialized databases.
-- The menu API already orders by createdAt DESC when this setting is enabled.
INSERT INTO "MenuSettings" ("id", "languageSwitcherEnabled", "newestDishesFirst", "updatedAt")
VALUES ('global', false, true, CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO UPDATE
SET "newestDishesFirst" = true,
    "updatedAt" = CURRENT_TIMESTAMP;
