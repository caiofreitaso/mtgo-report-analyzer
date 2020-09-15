'use strict';

var dbm;
var type;
var seed;

const FUNCTION_NAME = 'view_meta_trimmed';

/**
  * We receive the dbmigrate dependency from dbmigrate initially.
  * This enables us to not have to rely on NODE_PATH.
  */
exports.setup = function(options, seedLink) {
  dbm = options.dbmigrate;
  type = dbm.dataType;
  seed = seedLink;
};

exports.up = function(db) {
  return db.runSql(`
CREATE OR REPLACE FUNCTION ${FUNCTION_NAME}(start_time timestamp, end_time timestamp)
RETURNS TABLE(
    archetype_id meta.archetype_id%TYPE,
    label archetype.label%TYPE,
    metric numeric,
    meta_count bigint,
    meta_share numeric
)
LANGUAGE plpgsql AS $$
BEGIN
RETURN QUERY
SELECT *
FROM view_meta_weighted(start_time, end_time) v
WHERE v.meta_count > 1
ORDER BY metric DESC;
END;
$$;`);
};

exports.down = function(db) {
  return db.runSql(`DROP FUNCTION ${FUNCTION_NAME}`);
};

exports._meta = {
  "version": 1
};
