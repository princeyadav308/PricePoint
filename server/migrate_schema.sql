BEGIN;

-- Create Enums if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'PaymentStatus') THEN
        CREATE TYPE "PaymentStatus" AS ENUM ('Pending', 'Paid', 'Failed');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'GenerationStatus') THEN
        CREATE TYPE "GenerationStatus" AS ENUM ('idle', 'generating', 'complete', 'failed');
    END IF;
END$$;

-- Cast existing text values to the new enum types
ALTER TABLE "Report" 
  ALTER COLUMN "paymentStatus" DROP DEFAULT,
  ALTER COLUMN "paymentStatus" TYPE "PaymentStatus" USING "paymentStatus"::"text"::"PaymentStatus",
  ALTER COLUMN "paymentStatus" SET DEFAULT 'Pending'::"PaymentStatus";

ALTER TABLE "Report" 
  ALTER COLUMN "generationStatus" DROP DEFAULT,
  ALTER COLUMN "generationStatus" TYPE "GenerationStatus" USING "generationStatus"::"text"::"GenerationStatus",
  ALTER COLUMN "generationStatus" SET DEFAULT 'idle'::"GenerationStatus";

-- amountPaid float8 -> numeric(10,2)
ALTER TABLE "Report"
  ALTER COLUMN "amountPaid" TYPE numeric(10,2);

-- lastUpdatedAt BigInt -> timestamp
ALTER TABLE "Session" 
  ALTER COLUMN "lastUpdatedAt" TYPE timestamp(3) 
  USING to_timestamp("lastUpdatedAt" / 1000.0);

COMMIT;
