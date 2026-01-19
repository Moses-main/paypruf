-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "transactionHash" TEXT NOT NULL,
    "senderAddress" TEXT NOT NULL,
    "recipientAddress" TEXT NOT NULL,
    "amount" TEXT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USDT0',
    "memo" TEXT,
    "proofRailsRecordId" TEXT,
    "proofHash" TEXT,
    "flareAnchorTxHash" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "walletAddress" TEXT NOT NULL,
    "xrplAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Payment_transactionHash_key" ON "Payment"("transactionHash");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_flareAnchorTxHash_key" ON "Payment"("flareAnchorTxHash");

-- CreateIndex
CREATE INDEX "Payment_senderAddress_idx" ON "Payment"("senderAddress");

-- CreateIndex
CREATE INDEX "Payment_recipientAddress_idx" ON "Payment"("recipientAddress");

-- CreateIndex
CREATE INDEX "Payment_createdAt_idx" ON "Payment"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "User_walletAddress_key" ON "User"("walletAddress");

-- CreateIndex
CREATE UNIQUE INDEX "User_xrplAddress_key" ON "User"("xrplAddress");

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_senderAddress_fkey" FOREIGN KEY ("senderAddress") REFERENCES "User"("walletAddress") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_recipientAddress_fkey" FOREIGN KEY ("recipientAddress") REFERENCES "User"("walletAddress") ON DELETE SET NULL ON UPDATE CASCADE;
