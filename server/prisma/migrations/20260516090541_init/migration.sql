-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "refreshToken" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "TaxiProfile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "licensePlate" TEXT NOT NULL,
    "carModel" TEXT NOT NULL,
    "carColor" TEXT NOT NULL,
    "licenseNumber" TEXT NOT NULL,
    "photoUrl" TEXT,
    "logoUrl" TEXT,
    "pixKey" TEXT,
    "pixBank" TEXT,
    "themeColor" TEXT NOT NULL DEFAULT '#F5C518',
    "darkMode" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "TaxiProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Ride" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "receiptNumber" INTEGER NOT NULL,
    "receiptCode" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "rideDate" DATETIME NOT NULL,
    "passengerName" TEXT NOT NULL,
    "passengerEmail" TEXT,
    "passengerPhone" TEXT,
    "originAddress" TEXT NOT NULL,
    "destAddress" TEXT NOT NULL,
    "distanceKm" REAL,
    "durationMinutes" INTEGER,
    "baseValue" REAL NOT NULL,
    "extras" TEXT NOT NULL DEFAULT '[]',
    "totalValue" REAL NOT NULL,
    "paymentMethod" TEXT NOT NULL,
    "observations" TEXT,
    "receiptUrl" TEXT,
    "pdfUrl" TEXT,
    "emailSent" BOOLEAN NOT NULL DEFAULT false,
    "emailSentAt" DATETIME,
    "whatsappSent" BOOLEAN NOT NULL DEFAULT false,
    "expiresAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Ride_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "TaxiProfile_userId_key" ON "TaxiProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Ride_receiptCode_key" ON "Ride"("receiptCode");

-- CreateIndex
CREATE UNIQUE INDEX "Ride_userId_receiptNumber_key" ON "Ride"("userId", "receiptNumber");
