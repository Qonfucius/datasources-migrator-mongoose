const mongoose = require('mongoose');
const { promisify } = require('util');
const fs = require('fs');
const { join } = require('path');
const readdir = promisify(fs.readdir);

module.exports = {
  async play(db, { path, rollback }, migrationFiles = []) {
    const migrations = migrationFiles
      .filter(file => ~file.search(/^[^.].*\.js$/))
      .map(file => require(join(process.cwd(), path, file)));
    if (rollback) {
      migrations.reverse();
    }
    for (const migration of migrations) {
      await migration[rollback ? 'down' : 'up'](mongoose);
    }
  },

  async init({ uri, models, destroyOld = false } = {}) {
    mongoose.Promise = Promise;
    mongoose.connection.on('error', console.error);
    const db = await mongoose.connect(uri);
    if (destroyOld) {
      await mongoose.connection.db.dropDatabase();
    }
    const modelsPath = join(process.cwd(), models);
    (await readdir(modelsPath))
      .filter(file => ~file.search(/^[^.].*\.js$/))
      .map(modelName => require(join(modelsPath, modelName)))
      .filter(model => !!model.schema)
      .forEach(model => mongoose.model(model.modelName, model.schema));
    return db;
  },

  async end() {
    return mongoose.disconnect();
  }
};
