-- 002_fix_withdrawal_reference.sql
--
-- Fixes wp_bl_withdrawals.uq_reference so it actually enforces what the
-- comment above the table in 001_initial.sql claims: "a retried request
-- carrying the same reference must return the ORIGINAL row rather than
-- create a second payout."
--
-- The original key was UNIQUE (instructor_id, payout_reference, cancelled_at).
-- cancelled_at is NULL for every normal (non-cancelled) withdrawal, and MySQL
-- treats each NULL in a unique index as distinct from every other NULL - so
-- two rows with the same instructor_id and payout_reference, both with
-- cancelled_at NULL, do NOT collide. The three-column key never actually
-- constrained the case it was meant to protect: an instructor retrying the
-- same withdrawal.
--
-- Fix: drop cancelled_at from the key entirely. payout_reference is the
-- idempotency key for an instructor's withdrawal attempts - it is required
-- by the API (BL_Earnings_Controller marks it 'required' => true) and must
-- be unique per instructor regardless of whether the withdrawal was later
-- cancelled.
--
-- Existing duplicate rows block a unique index from being created. Any such
-- rows must be resolved (deduplicated) before running this file - see
-- answers/task-5.md for what was found and how it was handled on this
-- database.

ALTER TABLE wp_bl_withdrawals
  DROP INDEX uq_reference,
  ADD UNIQUE KEY uq_reference (instructor_id, payout_reference);
