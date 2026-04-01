-- Add 'archived' as a valid idea status
ALTER TABLE admin_board_items
  DROP CONSTRAINT IF EXISTS admin_board_items_status_check;

ALTER TABLE admin_board_items
  ADD CONSTRAINT admin_board_items_status_check
  CHECK (status IN ('open', 'in_progress', 'done', 'validated', 'discarded', 'archived'));
