-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "refreshToken" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaxiProfile" (
    "id" TEXT NOT NULL,
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
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TaxiProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ride" (
    "id" TEXT NOT NULL,
    "receiptNumber" INTEGER NOT NULL,
    "receiptCode" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "rideDate" TIMESTAMP(3) NOT NULL,
    "passengerName" TEXT NOT NULL,
    "passengerEmail" TEXT,
    "passengerPhone" TEXT,
    "originAddress" TEXT NOT NULL,
    "destAddress" TEXT NOT NULL,
    "distanceKm" DOUBLE PRECISION,
    "durationMinutes" INTEGER,
    "baseValue" DOUBLE PRECISION NOT NULL,
    "extras" TEXT NOT NULL DEFAULT '[]',
    "totalValue" DOUBLE PRECISION NOT NULL,
    "paymentMethod" TEXT NOT NULL,
    "observations" TEXT,
    "receiptUrl" TEXT,
    "pdfUrl" TEXT,
    "emailSent" BOOLEAN NOT NULL DEFAULT false,
    "emailSentAt" TIMESTAMP(3),
    "whatsappSent" BOOLEAN NOT NULL DEFAULT false,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Ride_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "TaxiProfile_userId_key" ON "TaxiProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Ride_receiptCode_key" ON "Ride"("receiptCode");

-- CreateIndex
CREATE UNIQUE INDEX "Ride_userId_receiptNumber_key" ON "Ride"("userId", "receiptNumber");

-- AddForeignKey
ALTER TABLE "TaxiProfile" ADD CONSTRAINT "TaxiProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ride" ADD CONSTRAINT "Ride_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
