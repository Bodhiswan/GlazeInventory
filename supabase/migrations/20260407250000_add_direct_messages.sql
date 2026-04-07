-- Direct messages between users (1:1 chat).
-- Notifications remain unread until recipient explicitly marks as read.

CREATE TABLE IF NOT EXISTS public.direct_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body text NOT NULL CHECK (length(body) > 0 AND length(body) <= 4000),
  created_at timestamptz NOT NULL DEFAULT now(),
  read_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_direct_messages_recipient_unread
  ON public.direct_messages (recipient_user_id, read_at);
CREATE INDEX IF NOT EXISTS idx_direct_messages_pair_created
  ON public.direct_messages (sender_user_id, recipient_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_direct_messages_recipient_created
  ON public.direct_messages (recipient_user_id, created_at DESC);

ALTER TABLE public.direct_messages ENABLE ROW LEVEL SECURITY;

-- Users can read any DM where they are sender or recipient.
CREATE POLICY direct_messages_select ON public.direct_messages
  FOR SELECT USING (
    auth.uid() = sender_user_id OR auth.uid() = recipient_user_id
  );

-- Users can send messages as themselves.
CREATE POLICY direct_messages_insert ON public.direct_messages
  FOR INSERT WITH CHECK (auth.uid() = sender_user_id);

-- Recipient can update (to mark as read). Sender can also update (for future edit).
CREATE POLICY direct_messages_update ON public.direct_messages
  FOR UPDATE USING (
    auth.uid() = recipient_user_id OR auth.uid() = sender_user_id
  );
