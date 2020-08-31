'use strict';

var dbm;
var type;
var seed;

const INDEX_NAME = 'idx__meta__archetype_id';

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
  return db.addIndex('meta', INDEX_NAME, ['archetype_id']);
};

exports.down = function(db) {
  return db.removeIndex(INDEX_NAME);
};

exports._meta = {
  "version": 1
};
