-- CreateTable
CREATE TABLE "AdminLoginAttempt" (
    "key" TEXT NOT NULL,
    "failures" INTEGER NOT NULL DEFAULT 0,
    "windowStart" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lockedUntil" TIMESTAMP(3),

    CONSTRAINT "AdminLoginAttempt_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE INDEX "AdminLoginAttempt_windowStart_idx" ON "AdminLoginAttempt"("windowStart");

