'use strict';

var dbm;
var type;
var seed;

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
  return db.runSql("CREATE TYPE card_type AS ENUM ('artifact', 'conspiracy', 'creature', 'enchantment', 'instant', 'land', 'phenomenon', 'plane', 'planeswalker', 'scheme', 'sorcery', 'tribal', 'vanguard', 'basic', 'legendary', 'ongoing', 'snow', 'world')");
};

exports.down = function(db) {
  return db.runSql("DROP TYPE card_type");
};

exports._meta = {
  "version": 1
};
