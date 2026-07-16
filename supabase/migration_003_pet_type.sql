-- OneBlock — migration 003: pet type on family members
-- Run this once in the Supabase SQL Editor.
-- Safe to re-run.

alter table public.family_members add column if not exists pet_type text;
