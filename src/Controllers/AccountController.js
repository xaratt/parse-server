var DatabaseAdapter = require('../DatabaseAdapter'),
    triggers = require('../triggers'),
    request = require('request'),
    ObjectID = require('mongodb').ObjectID,
    cryptoUtils = require('../cryptoUtils')
    ;

export class AccountController {

  constructor(dbApplicationId) {
    this.dbApplicationId = dbApplicationId;
  }

  database() {
    return DatabaseAdapter.getDatabaseConnection(this.dbApplicationId);
  }

  collection(collectionName) {
    if (!this._collections) {
        this._collections = {};
    }
    if (this._collections[collectionName]) {
      return Promise.resolve(this._collections[collectionName])
    }
    return this.database().rawCollection(collectionName).then((collection) => {
      this._collections[collectionName] = collection;
      return collection;
    });
  }

  getKeys(userId) {
    return this.collection("_AccountKeys").then((collection) => {
        // TODO: add sort
        var query = {"userId": userId, "expiresAt": {"$gte":(new Date()).toISOString()}};
        return collection.find(query).toArray();
    }).then(function(keys) {
        return keys.map(function(key) {
            delete key["userId"];
            key["id"] = key["_id"];
            delete key["_id"];
            key["token"] = "****" + key["token"].substr(-4);
            return key;
        });
    });
  }

  createKey(userId, keyName) {
    var d = new Date();
    d.setFullYear(d.getFullYear() + 1);
    var key = {
        name: keyName,
        token: cryptoUtils.newToken(),
        scope: "apps",
        expiresAt: d.toISOString(),
        userId: userId
    }
    return this.collection("_AccountKeys").then((collection) => {
      // TODO: check unique key name & userid
      return collection.insert(key)
    }).then(function(res) {
      delete key["userId"];
      key["id"] = key["_id"];
      delete key["_id"];
      return key;
      //return '{"id":1358362,"name":"test111","token":"r1z8jQ9g3P6QYe731M0NzIWFL7dbD7xnB4eYIn9R","scope":"apps","expiresAt":"2017-03-09T22:21:03Z"}';
    });
  }

  deleteKey(userId, keyId) {
    return this.collection("_AccountKeys").then((collection) => {
        var query = {"userId": userId, "_id": ObjectID(keyId)};
        return collection.remove(query)
    }).then(function(res) {
      //TODO: check response format
      return {"ok": res.result.ok, "n": res.result.n, "id": keyId};
    });
  }

}

export default AccountController;
