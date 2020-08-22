'use strict';

var dbm;
var type;
var seed;

const TABLE_NAME = 'card';

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
  return db.createTable(TABLE_NAME, {
    id: { type: 'int', primaryKey: true, autoIncrement: true, unsigned: true },
    name: { type: 'string', notNull: true },
    types: { type: 'card_type[]', notNull: true },
    colors: { type: 'card_color[]', notNull: true },
    effective_colors: { type: 'card_color[]', notNull: true },
    cmc: { type: 'int', notNull: true },
    effective_cmc: { type: 'int', notNull: true }
  });
};

exports.down = function(db) {
  return db.dropTable(TABLE_NAME);
};

exports._meta = {
  "version": 1
};
