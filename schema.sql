-- MAHGOOZ PostgreSQL schema. The server creates these tables automatically at startup.
CREATE TABLE IF NOT EXISTS venues (
 id SERIAL PRIMARY KEY, name TEXT NOT NULL UNIQUE, rating NUMERIC(2,1) NOT NULL DEFAULT 0,
 location TEXT NOT NULL, category TEXT NOT NULL, tags TEXT[] NOT NULL DEFAULT '{}',
 capacity INTEGER NOT NULL DEFAULT 10, price INTEGER NOT NULL DEFAULT 0, active BOOLEAN NOT NULL DEFAULT TRUE,
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS bookings (
 id BIGSERIAL PRIMARY KEY, venue_name TEXT NOT NULL, occasion TEXT NOT NULL,
 booking_date DATE NOT NULL, booking_time TIME NOT NULL, guests INTEGER NOT NULL,
 customer_name TEXT NOT NULL, phone TEXT NOT NULL, notes TEXT DEFAULT '',
 status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','confirmed','cancelled')),
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
