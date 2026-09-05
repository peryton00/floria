-- ============================================================
-- Floria — Migration 0039: Atomic Checkout & Inventory Reservation RPC
-- Wraps inventory deduction, order insertion, line item creation,
-- and fulfillment allocation inside a single atomic transaction.
-- ============================================================

CREATE OR REPLACE FUNCTION place_order_atomic(
  p_order_payload JSONB,
  p_line_items JSONB,
  p_fulfillments JSONB
)
RETURNS UUID AS $$
DECLARE
  v_order_id UUID;
  v_item RECORD;
  v_fulfillment RECORD;
  v_rows_affected INT;
  v_product_id UUID;
  v_quantity INT;
  v_product_name TEXT;
BEGIN
  -- 1. Deduct inventory atomically with compare-and-swap
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_line_items)
  LOOP
    v_product_id := (v_item.value->>'product_id')::UUID;
    v_quantity := (v_item.value->>'quantity')::INT;
    v_product_name := COALESCE(v_item.value->>'product_name_snapshot', v_item.value->>'name', 'Product');

    UPDATE inventory
    SET stock_quantity = stock_quantity - v_quantity,
        updated_at = now()
    WHERE product_id = v_product_id
      AND stock_quantity >= v_quantity;

    GET DIAGNOSTICS v_rows_affected = ROW_COUNT;

    IF v_rows_affected = 0 THEN
      RAISE EXCEPTION 'OUT_OF_STOCK: %', v_product_name USING ERRCODE = 'P0001';
    END IF;
  END LOOP;

  -- 2. Insert order record
  INSERT INTO orders (
    customer_id,
    seller_id,
    status,
    delivery_address_snapshot,
    subtotal_paise,
    maintenance_fee_paise,
    delivery_fee_paise,
    delivery_fee_reason,
    delivery_threshold_paise_snapshot,
    eligible_delivery_subtotal_paise,
    commission_rate,
    commission_paise,
    total_paise,
    notes,
    created_at,
    updated_at
  ) VALUES (
    (p_order_payload->>'customer_id')::UUID,
    (p_order_payload->>'seller_id')::UUID,
    (p_order_payload->>'status')::TEXT,
    (p_order_payload->'delivery_address_snapshot'),
    (p_order_payload->>'subtotal_paise')::BIGINT,
    (p_order_payload->>'maintenance_fee_paise')::BIGINT,
    (p_order_payload->>'delivery_fee_paise')::BIGINT,
    (p_order_payload->>'delivery_fee_reason')::TEXT,
    (p_order_payload->>'delivery_threshold_paise_snapshot')::BIGINT,
    (p_order_payload->>'eligible_delivery_subtotal_paise')::BIGINT,
    (p_order_payload->>'commission_rate')::NUMERIC,
    (p_order_payload->>'commission_paise')::BIGINT,
    (p_order_payload->>'total_paise')::BIGINT,
    (p_order_payload->>'notes')::TEXT,
    now(),
    now()
  )
  RETURNING id INTO v_order_id;

  -- 3. Insert line items
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_line_items)
  LOOP
    INSERT INTO order_items (
      order_id,
      product_id,
      product_name_snapshot,
      seller_id_snapshot,
      base_price_paise_snapshot,
      floria_profit_rate_snapshot,
      floria_profit_paise_snapshot,
      delivery_recovery_paise_snapshot,
      customer_price_paise_snapshot,
      is_free_delivery_eligible_snapshot,
      unit_price_paise_snapshot,
      quantity,
      line_total_paise,
      commission_rate_snapshot,
      commission_paise_snapshot,
      created_at
    ) VALUES (
      v_order_id,
      (v_item.value->>'product_id')::UUID,
      (v_item.value->>'product_name_snapshot')::TEXT,
      (v_item.value->>'seller_id_snapshot')::UUID,
      (v_item.value->>'base_price_paise_snapshot')::BIGINT,
      (v_item.value->>'floria_profit_rate_snapshot')::NUMERIC,
      (v_item.value->>'floria_profit_paise_snapshot')::BIGINT,
      (v_item.value->>'delivery_recovery_paise_snapshot')::BIGINT,
      (v_item.value->>'customer_price_paise_snapshot')::BIGINT,
      (v_item.value->>'is_free_delivery_eligible_snapshot')::BOOLEAN,
      (v_item.value->>'unit_price_paise_snapshot')::BIGINT,
      (v_item.value->>'quantity')::INT,
      (v_item.value->>'line_total_paise')::BIGINT,
      (v_item.value->>'commission_rate_snapshot')::NUMERIC,
      (v_item.value->>'commission_paise_snapshot')::BIGINT,
      now()
    );
  END LOOP;

  -- 4. Insert fulfillments
  FOR v_fulfillment IN SELECT * FROM jsonb_array_elements(p_fulfillments)
  LOOP
    INSERT INTO seller_order_fulfillments (
      order_id,
      seller_id,
      status,
      created_at,
      updated_at
    ) VALUES (
      v_order_id,
      (v_fulfillment.value->>'seller_id')::UUID,
      (v_fulfillment.value->>'status')::TEXT,
      now(),
      now()
    );
  END LOOP;

  RETURN v_order_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
