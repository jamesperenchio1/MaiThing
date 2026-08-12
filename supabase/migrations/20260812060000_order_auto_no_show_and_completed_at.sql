-- Migration: automatic order cleanup
-- 1. Track when an order was effectively completed.
-- 2. Mark orders as no-show when the customer never shows up within the pickup window.

-- ============================================
-- completed_at tracking
-- ============================================
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

-- Whenever an order reaches the 'collected' state, stamp completed_at once.
CREATE OR REPLACE FUNCTION stamp_order_completed_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'collected' AND NEW.completed_at IS NULL THEN
    NEW.completed_at := NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_stamp_order_completed_at ON orders;
CREATE TRIGGER trg_stamp_order_completed_at
  BEFORE INSERT OR UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION stamp_order_completed_at();

-- Backfill completed_at for existing collected orders.
UPDATE orders
SET completed_at = updated_at
WHERE status = 'collected'
  AND completed_at IS NULL;

-- ============================================
-- Auto no-show after 24h past pickup window
-- ============================================
CREATE INDEX IF NOT EXISTS idx_orders_status_pickup_end
ON orders(status, pickup_end);

CREATE OR REPLACE FUNCTION auto_no_show_orders()
RETURNS void AS $$
BEGIN
  UPDATE orders
  SET
    status = 'no_show',
    cancellation_reason = 'Customer did not pick up within the pickup window'
  WHERE status IN ('reserved', 'paid')
    AND pickup_end IS NOT NULL
    AND pickup_end < NOW() - INTERVAL '24 hours';
END;
$$ LANGUAGE plpgsql;

-- Schedule the cleanup to run every hour.
CREATE EXTENSION IF NOT EXISTS pg_cron;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'auto-no-show-orders') THEN
    PERFORM cron.unschedule('auto-no-show-orders');
  END IF;
END $$;

SELECT cron.schedule(
  'auto-no-show-orders',
  '0 * * * *',
  'SELECT auto_no_show_orders();'
);
