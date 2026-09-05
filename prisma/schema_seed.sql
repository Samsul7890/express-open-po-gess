-- ============================================================
-- Open PO Gess — Full Schema + Seed
-- Run this in: Supabase Dashboard → SQL Editor
-- ============================================================

-- ── 0. Extensions ───────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "pgcrypto";


-- ── 1. Enum ─────────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE "OrderStatus" AS ENUM ('incoming', 'confirm', 'cancel', 'done');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;


-- ── 2. Tables (dependency order) ────────────────────────────

-- user
CREATE TABLE IF NOT EXISTS "user" (
  pk_user_id   UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  name         VARCHAR(100) NOT NULL,
  email        VARCHAR(100) UNIQUE,
  phone_number VARCHAR(13)  UNIQUE,
  role         VARCHAR(50)  NOT NULL DEFAULT 'customer',
  google_id    VARCHAR(255),
  password     VARCHAR(255)
);

-- store
CREATE TABLE IF NOT EXISTS "store" (
  pk_store_id  UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  store_name   VARCHAR(100) NOT NULL,
  banner_path  VARCHAR(255),
  avatar_path  VARCHAR(255),
  phone_number VARCHAR(13),
  owner        UUID         NOT NULL REFERENCES "user"(pk_user_id)
);

-- product
CREATE TABLE IF NOT EXISTS "product" (
  pk_product_id SERIAL       PRIMARY KEY,
  product_name  VARCHAR(100) NOT NULL,
  description   TEXT,
  price         FLOAT        NOT NULL,
  fk_store_id   UUID         NOT NULL REFERENCES "store"(pk_store_id),
  deleted_at    TIMESTAMPTZ
);

-- galery
CREATE TABLE IF NOT EXISTS "galery" (
  pk_galery_id  SERIAL       PRIMARY KEY,
  galery_path   VARCHAR(255) NOT NULL,
  fk_product_id INT          NOT NULL REFERENCES "product"(pk_product_id)
);

-- additional_product
CREATE TABLE IF NOT EXISTS "additional_product" (
  pk_additional_id SERIAL       PRIMARY KEY,
  name             VARCHAR(100) NOT NULL,
  price            FLOAT        NOT NULL,
  fk_product_id    INT          NOT NULL REFERENCES "product"(pk_product_id)
);

-- open_po
CREATE TABLE IF NOT EXISTS "open_po" (
  pk_po_id      UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  start_date    TIMESTAMPTZ,
  end_date      TIMESTAMPTZ,
  cut_off       INT          NOT NULL,
  always_ready  BOOLEAN      NOT NULL DEFAULT false,
  fk_product_id INT          NOT NULL REFERENCES "product"(pk_product_id),
  fk_store_id   UUID         NOT NULL REFERENCES "store"(pk_store_id)
);

-- order_po
CREATE TABLE IF NOT EXISTS "order_po" (
  pk_order_id    SERIAL        PRIMARY KEY,
  fk_user_id     UUID          NOT NULL REFERENCES "user"(pk_user_id),
  fk_po_id       UUID          NOT NULL REFERENCES "open_po"(pk_po_id),
  requested_date TIMESTAMPTZ   NOT NULL,
  status         "OrderStatus" NOT NULL DEFAULT 'incoming',
  qty            INT           NOT NULL,
  price          FLOAT         NOT NULL,
  notes          TEXT,
  created_at     TIMESTAMPTZ   NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ   NOT NULL DEFAULT now()
);

-- additional_po
CREATE TABLE IF NOT EXISTS "additional_po" (
  pk_additional_po_id SERIAL PRIMARY KEY,
  fk_additional_id    INT    NOT NULL REFERENCES "additional_product"(pk_additional_id),
  fk_order_id         INT    NOT NULL REFERENCES "order_po"(pk_order_id),
  price               FLOAT  NOT NULL
);

-- customer_store
CREATE TABLE IF NOT EXISTS "customer_store" (
  pk_customer_store_id SERIAL      PRIMARY KEY,
  fk_user_id           UUID        NOT NULL REFERENCES "user"(pk_user_id) ON DELETE CASCADE,
  fk_store_id          UUID        NOT NULL REFERENCES "store"(pk_store_id) ON DELETE CASCADE,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (fk_user_id, fk_store_id)
);


-- ── 3. Seed Data ────────────────────────────────────────────
-- Passwords (bcrypt, cost 10):
--   seller@openpo.dev   → seller123
--   customer@openpo.dev → customer123

INSERT INTO "user" (pk_user_id, name, email, phone_number, role, password)
VALUES
  (
    gen_random_uuid(),
    'Seed Seller',
    'seller@openpo.dev',
    '08111111111',
    'seller',
    '$2b$10$JAuVgDLmoZvg8AFeyQKUgOP1dIbNIwvpRc5DeKOx/AH./VsKoV9YO'
  ),
  (
    gen_random_uuid(),
    'Seed Customer',
    'customer@openpo.dev',
    '08222222222',
    'customer',
    '$2b$10$fzunHfjaoGB1h8K2m1y6KuGuTH2SytmbdVvis4sgNXGUnS8zFxVMy'
  )
ON CONFLICT (email) DO NOTHING;
