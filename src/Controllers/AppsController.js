var DatabaseAdapter = require('../DatabaseAdapter'),
    triggers = require('../triggers'),
    request = require('request');
const collection = "_Applications";

export class AppsController {

  constructor() {
  }

  database() {
    return DatabaseAdapter.getDatabaseConnection(this.applicationId); //!!!!! no app id here
  }

  collection() {
    if (this._collection) {
      return Promise.resolve(this._collection)
    }
    return this.database().rawCollection(collection).then((collection) => {
      this._collection = collection;
      return collection;
    });
  }

}

export default AppsController;
