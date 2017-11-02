const { join } = require('path');

module.exports = function ({
  path, rollback, servicePath,
}, workingDir) {
  require(join(workingDir, servicePath));
  return {
    async play(db, migrationFiles = []) {
      const migrations = migrationFiles
        .filter(file => ~file.search(/^[^.].*\.js$/))
        .map(file => require(join(workingDir, path, file)));
      if (rollback) {
        migrations.reverse();
      }
      for (const migration of migrations) {
        await migration[rollback ? 'down' : 'up']();
      }
    },

    async init() {
      return true;
    },

    async end() {
      return true;
    },
  };
};
