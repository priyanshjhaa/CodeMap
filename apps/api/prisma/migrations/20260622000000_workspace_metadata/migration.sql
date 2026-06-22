ALTER TABLE "Workspace" ADD COLUMN "teamSize" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "Workspace" ADD COLUMN "goal" TEXT;

CREATE TABLE "AuthSession" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,
    CONSTRAINT "AuthSession_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AuthSession_userId_provider_key" ON "AuthSession"("userId", "provider");
ALTER TABLE "AuthSession" ADD CONSTRAINT "AuthSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
