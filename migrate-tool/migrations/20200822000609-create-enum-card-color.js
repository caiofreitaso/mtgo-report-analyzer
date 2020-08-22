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
  return db.runSql("CREATE TYPE card_color AS ENUM ('white', 'blue', 'black', 'green', 'red')");
};

exports.down = function(db) {
  return db.runSql("DROP TYPE card_color");
};

exports._meta = {
  "version": 1
};
