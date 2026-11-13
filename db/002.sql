DROP POLICY lab_read ON laboratories;
CREATE POLICY lab_read ON laboratories FOR SELECT USING (can_lab(id) OR actor_role()='Faculty/Staff');
CREATE UNIQUE INDEX serial_unique ON items(lower(details->>'serial')) WHERE coalesce(details->>'serial','')<>'';
CREATE OR REPLACE FUNCTION capacity_guard() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN
IF current_user='mga_app' AND OLD.archived IS DISTINCT FROM NEW.archived AND NOT is_admin() THEN RAISE EXCEPTION 'Administrator required to archive/unarchive laboratory'; END IF;
IF (NEW.profile->>'operational')::numeric>(NEW.profile->>'stations')::numeric OR (NEW.profile->>'functional')::numeric>(NEW.profile->>'approved')::numeric THEN RAISE EXCEPTION 'Invalid capacity'; END IF; RETURN NEW; END $$;
CREATE TRIGGER lab_capacity_guard BEFORE UPDATE ON laboratories FOR EACH ROW EXECUTE FUNCTION capacity_guard();
CREATE OR REPLACE FUNCTION serialized_guard() RETURNS trigger LANGUAGE plpgsql AS $$ DECLARE serial text; total bigint; BEGIN
SELECT details->>'serial' INTO serial FROM items WHERE id=NEW.item_id;
IF coalesce(serial,'')<>'' THEN
 PERFORM pg_advisory_xact_lock(hashtextextended(NEW.item_id::text,1));
 SELECT coalesce(sum(delta),0) INTO total FROM movements WHERE item_id=NEW.item_id;
 IF total+NEW.delta>1 THEN RAISE EXCEPTION 'Serialized asset cannot exceed one available unit'; END IF;
END IF; RETURN NEW; END $$;
CREATE TRIGGER serialized_guard BEFORE INSERT ON movements FOR EACH ROW EXECUTE FUNCTION serialized_guard();
CREATE OR REPLACE FUNCTION transfer_guard() RETURNS trigger LANGUAGE plpgsql AS $$ DECLARE matches int; BEGIN
IF NEW.kind='Transfer' THEN SELECT count(*) INTO matches FROM movements WHERE kind='Transfer in' AND related_id=NEW.id AND item_id=NEW.item_id AND delta= -NEW.delta AND lab_id<>NEW.lab_id;
 IF matches<>1 THEN RAISE EXCEPTION 'Transfer requires a matching destination'; END IF;
ELSIF NEW.kind='Transfer in' THEN SELECT count(*) INTO matches FROM movements WHERE kind='Transfer' AND id=NEW.related_id AND item_id=NEW.item_id AND delta= -NEW.delta AND lab_id<>NEW.lab_id;
 IF matches<>1 THEN RAISE EXCEPTION 'Transfer requires a matching source'; END IF;
END IF; RETURN NEW; END $$;
CREATE CONSTRAINT TRIGGER transfer_pair AFTER INSERT ON movements DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION transfer_guard();
INSERT INTO migrations VALUES(2);
