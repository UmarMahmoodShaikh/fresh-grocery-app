-- Project Alignment: Add missing columns to 'users' table if they don't exist
-- Requirements from project(1).pdf: record first name, last name, phone, billing details

DO $$
BEGIN
    -- Add firstName if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='firstName') THEN
        ALTER TABLE users ADD COLUMN "firstName" TEXT;
    END IF;

    -- Add lastName if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='lastName') THEN
        ALTER TABLE users ADD COLUMN "lastName" TEXT;
    END IF;

    -- Add phone if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='phone') THEN
        ALTER TABLE users ADD COLUMN "phone" TEXT;
    END IF;

    -- Add billingAddress if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='billingAddress') THEN
        ALTER TABLE users ADD COLUMN "billingAddress" TEXT;
    END IF;
    
    -- Ensure Invoices table exists (Basic structure matching spec implied needs)
    CREATE TABLE IF NOT EXISTS "Invoices" (
        id SERIAL PRIMARY KEY,
        "userId" INTEGER REFERENCES users(id) ON DELETE SET NULL,
        items JSONB DEFAULT '[]', -- Stores product snapshots
        total NUMERIC(10, 2) NOT NULL DEFAULT 0,
        "billingAddress" TEXT,
        "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        status TEXT DEFAULT 'pending' -- pending, paid, cancelled
    );

END $$;
