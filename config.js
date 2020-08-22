'use strict';

class DatabaseConfig {
  constructor() {
      this.host = process.env.MTGO_REPORT_DB_HOST || 'localhost';
      this.port = parseInt(process.env.MTGO_REPORT_DB_PORT || 5432);
      this.database = process.env.MTGO_REPORT_DB_DATABASE || 'mtgo_analyzer';
      this.user = process.env.MTGO_REPORT_DB_USER || 'postgres';
      this.password = process.env.MTGO_REPORT_DB_PASSWORD || 'iwannarock';
  }

  databaseUrl() {
    return `postgresql://${this.user}:${this.password}@${this.host}:${this.port}/${this.database}`;
  }
}

exports.databaseUrl = () => {
  let config = new DatabaseConfig();
  return config.databaseUrl();
};
