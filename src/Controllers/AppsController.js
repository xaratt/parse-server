var DatabaseAdapter = require('../DatabaseAdapter'),
    triggers = require('../triggers'),
    request = require('request');
const collection = "_Applications";

export class AppsController {

  constructor(dbApplicationId) {
    this.dbApplicationId = dbApplicationId;
  }

  database() {
    return DatabaseAdapter.getDatabaseConnection(this.dbApplicationId);
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

  removePrivateFields(app) {
    var anApp = {};
    Object.keys(app).forEach(function(field) {
      if ('_' == field[0]) {
        anApp[field] = app[field];
      }
    });
    return anApp;
  }

  getApplication(userId, applicationId) {
    var app = this.getOne({userId: userId, _id: applicationId});
    if (app) {
      return removePrivateFields(app);
    }
    else {
      throw new Parse.Error(Parse.Error.OBJECT_NOT_FOUND, "requested resource was not found");
    }
  }

  getApplications(userId) {
    var apps = this.get({userId: userId});
    return apps.map(function(app) {
      return removePrivateFields(app);
    });
  }

  deleteApplication(userId, applicationId) {
    return this.delete({userId: userId, _id: applicationId});
  }

  delete(query) {
    return this.collection().then((collection) => {
      return collection.remove(query)
    }).then( (res) => {
      return {};
    }, 1);
  }

  getOne(query) {
    return this.collection()
    .then(coll => coll.findOne(query, {_id: 0}))
    .then(app => {
      return app;
    });
  }
  
  get(query) {
    return this.collection()
    .then(coll => coll.find(query, {_id: 0}).toArray())
    .then(apps => {
      return apps;
    });
  }

  saveApplication(userId, applicationId, app) {
    // TODO: add validation here
    var query = {userId: userId};
    if (applicationId) {
      query["_id"] = applicationId;
    }
    return this.collection().then((collection) => {
      return collection.update(query, app, {upsert: true})
    }).then(function(res){
      return app;
    })
  }

  createApplication(userId, app) {
    return this.saveApplication(userId, app);
  }

  updateApplication(userId, applicationId, app) {
    return this.getApplication(userId, applicationId).then((result) => {
      if (result) {
        return this.saveApplication(userId, applicationId, app);
      }
    });
  }

}

export default AppsController;
