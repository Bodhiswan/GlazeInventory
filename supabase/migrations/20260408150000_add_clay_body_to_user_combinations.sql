-- Add optional clay_body column to user_combination_examples so contributors
-- can record what clay body they used in a combination submission.

alter table public.user_combination_examples
  add column if not exists clay_body text;
