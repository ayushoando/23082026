-- Add 3d_model column to products
ALTER TABLE products ADD COLUMN IF NOT EXISTS "3d_model" TEXT;

-- rollback
-- alter table products drop column if exists "3d_model";
