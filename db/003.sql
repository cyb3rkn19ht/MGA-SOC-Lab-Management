CREATE OR REPLACE FUNCTION purchase_reconciliation() RETURNS trigger LANGUAGE plpgsql AS $$ DECLARE total int; BEGIN SELECT coalesce(sum(qty),0) INTO total FROM receipts WHERE purchase_id=NEW.id; IF NEW.received<>total THEN RAISE EXCEPTION 'Order received quantity must reconcile to receipts'; END IF; IF (NEW.status='Received') IS DISTINCT FROM (NEW.received=NEW.qty) THEN RAISE EXCEPTION 'Delivery status must match receipts'; END IF; RETURN NEW; END $$;
CREATE CONSTRAINT TRIGGER purchase_reconciliation AFTER INSERT OR UPDATE ON purchases DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION purchase_reconciliation();
CREATE OR REPLACE FUNCTION serialized_guard() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ DECLARE serial text; total bigint; BEGIN
SELECT details->>'serial' INTO serial FROM items WHERE id=NEW.item_id;
IF coalesce(serial,'')<>'' AND NEW.kind NOT IN ('Checkout','Return') THEN
 PERFORM pg_advisory_xact_lock(hashtextextended(NEW.item_id::text,1));
 SELECT coalesce(sum(delta),0) INTO total FROM movements WHERE item_id=NEW.item_id AND kind NOT IN ('Checkout','Return');
 IF total+NEW.delta>1 THEN RAISE EXCEPTION 'Serialized asset cannot exceed one physical unit'; END IF;
END IF; RETURN NEW; END $$;
INSERT INTO migrations VALUES(3);
