'use strict';

const { exec } = require('child_process');
const databaseUrl = require('../config').databaseUrl();

process.env.DATABASE_URL = databaseUrl;

let parameters = process.argv.slice(2);
let commands = ['db-migrate'].concat(parameters).concat(['-m', './migrations']);
let command = commands.join(' ');

exec(command, (err, stdout, stderr) => {
  if (err) {
    console.log(stdout);
    console.error(err);
    process.exit(1);
  }

  console.log(stdout);
  console.error(stderr);
});
