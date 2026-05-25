-- SignalFlow AI — Initial Database Migration
-- Run this in Supabase SQL Editor

CREATE TABLE incidents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  vendor_name TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  risk_score INTEGER DEFAULT 0,
  status TEXT DEFAULT 'pending',
  operator_note TEXT DEFAULT '',
  ai_reasoning TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Disable RLS for development
ALTER TABLE incidents DISABLE ROW LEVEL SECURITY;