CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS "User" (
  pk_user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE,
  phone_number VARCHAR(50) UNIQUE,
  role VARCHAR(50) NOT NULL DEFAULT 'user',
  password VARCHAR(255),
  google_id VARCHAR(255) UNIQUE
);
