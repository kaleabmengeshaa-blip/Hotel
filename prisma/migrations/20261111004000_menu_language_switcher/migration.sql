CREATE TABLE "MenuSettings" (
    "id" TEXT NOT NULL DEFAULT 'global',
    "languageSwitcherEnabled" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MenuSettings_pkey" PRIMARY KEY ("id")
);
