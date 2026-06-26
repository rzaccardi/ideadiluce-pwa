CREATE TABLE "UserNotification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT,
    "payloadJson" JSONB,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserNotification_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "UserNotification_userId_createdAt_idx" ON "UserNotification"("userId", "createdAt");

ALTER TABLE "UserNotification" ADD CONSTRAINT "UserNotification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
