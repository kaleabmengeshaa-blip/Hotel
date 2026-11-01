-- CreateTable
CREATE TABLE "GuestSelection" (
    "id" TEXT NOT NULL,
    "hotelId" TEXT NOT NULL,
    "guestToken" TEXT NOT NULL,
    "isDismissed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GuestSelection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GuestSelectionItem" (
    "id" TEXT NOT NULL,
    "selectionId" TEXT NOT NULL,
    "menuItemId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "categoryName" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPrice" DECIMAL(10,2) NOT NULL,
    "unitPriceUsd" DECIMAL(10,2),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GuestSelectionItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GuestSelection_hotelId_guestToken_key" ON "GuestSelection"("hotelId", "guestToken");

-- CreateIndex
CREATE INDEX "GuestSelection_hotelId_updatedAt_idx" ON "GuestSelection"("hotelId", "updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "GuestSelectionItem_selectionId_menuItemId_key" ON "GuestSelectionItem"("selectionId", "menuItemId");

-- CreateIndex
CREATE INDEX "GuestSelectionItem_selectionId_idx" ON "GuestSelectionItem"("selectionId");

-- AddForeignKey
ALTER TABLE "GuestSelection" ADD CONSTRAINT "GuestSelection_hotelId_fkey" FOREIGN KEY ("hotelId") REFERENCES "Hotel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GuestSelectionItem" ADD CONSTRAINT "GuestSelectionItem_selectionId_fkey" FOREIGN KEY ("selectionId") REFERENCES "GuestSelection"("id") ON DELETE CASCADE ON UPDATE CASCADE;
