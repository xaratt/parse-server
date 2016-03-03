var DatabaseAdapter = require('../DatabaseAdapter'),
    triggers = require('../triggers'),
    request = require('request');
const collection = "_Hooks";

export class HooksController {
    
  constructor(applicationId) {
    this.applicationId = applicationId;
  }
  
  database() {
    return DatabaseAdapter.getDatabaseConnection(this.applicationId);
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
  
  getFunction(functionName) {
    return this.getOne({functionName: functionName})
  }
  
  getFunctions() {
    return this.get({functionName: { $exists: true }})
  }
  
  getTrigger(className, triggerName) {
    return this.getOne({className: className, triggerName: triggerName })
  }
  
  getTriggers() {
    return this.get({className: { $exists: true }, triggerName: { $exists: true }})
  }
  
  deleteFunction(functionName) {
    triggers.removeFunction(functionName, this.applicationId);
    return this.delete({functionName: functionName});
  }
  
  deleteTrigger(className, triggerName) {
    triggers.removeTrigger(triggerName, className, this.applicationId);
    return this.delete({className: className, triggerName: triggerName});
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
    .then(hook => {
      return hook;
    });
  }
  
  get(query) {
    return this.collection()
    .then(coll => coll.find(query, {_id: 0}).toArray())
    .then(hooks => {
      return hooks;
    });
  }
  
  getHooks() {
    return this.collection()
    .then(coll => coll.find({}, {_id: 0}).toArray())
    .then(hooks => {
      return hooks;
    }, () => ([]))   
  }
  
  saveHook(hook) {
    
    var query;
    if (hook.functionName && hook.url) {
      query = {functionName: hook.functionName }
    } else if (hook.triggerName && hook.className && hook.url) {
      query = { className: hook.className, triggerName: hook.triggerName }
    } else {
      throw new Parse.Error(143, "invalid hook declaration");
    }
    return this.collection().then((collection) => {
      return collection.update(query, hook, {upsert: true})
    }).then(function(res){
      return hook;
    })
  }
  
  addHookToTriggers(hook) {
    var wrappedFunction = wrapToHTTPRequest(hook);
    wrappedFunction.url = hook.url;
    if (hook.className) {
      triggers.addTrigger(hook.triggerName, hook.className, wrappedFunction, this.applicationId)
    } else {
      triggers.addFunction(hook.functionName, wrappedFunction, null, this.applicationId);
    }
  } 
  
  addHook(hook) {
    this.addHookToTriggers(hook);
    return this.saveHook(hook);
  }
  
  createOrUpdateHook(aHook) {
    var hook;
    if (aHook && aHook.functionName && aHook.url) {
      hook = {};
      hook.functionName = aHook.functionName;
      hook.url = aHook.url;
    } else if (aHook && aHook.className && aHook.url && aHook.triggerName && triggers.Types[aHook.triggerName]) {
      hook = {};
      hook.className = aHook.className;
      hook.url = aHook.url;
      hook.triggerName = aHook.triggerName;
      
    } else {
      throw new Parse.Error(143, "invalid hook declaration");
    } 
    
    return this.addHook(hook);
  };
  
  createHook(aHook) {
    if (aHook.functionName) {
      return this.getFunction(aHook.functionName).then((result) => {
        if (result) {
          throw new Parse.Error(143,`function name: ${aHook.functionName} already exits`);
        } else {
          return this.createOrUpdateHook(aHook);
        }
      });
    } else if (aHook.className && aHook.triggerName) {
      return this.getTrigger(aHook.className, aHook.triggerName).then((result) => {
        if (result) {
          throw new Parse.Error(143,`class ${aHook.className} already has trigger ${aHook.triggerName}`); 
        }
        return this.createOrUpdateHook(aHook);
      });
    }
    
    throw new Parse.Error(143, "invalid hook declaration");
  };
  
  updateHook(aHook) {
    if (aHook.functionName) {
      return this.getFunction(aHook.functionName).then((result) => {
        if (result) {
          return this.createOrUpdateHook(aHook);
        }
        throw new Parse.Error(143,`no function named: ${aHook.functionName} is defined`); 
      });
    } else if (aHook.className && aHook.triggerName) {
      return this.getTrigger(aHook.className, aHook.triggerName).then((result) => {
        if (result) {
          return this.createOrUpdateHook(aHook);
        }
        throw new Parse.Error(143,`class ${aHook.className} does not exist`); 
      });
    }
    throw new Parse.Error(143, "invalid hook declaration");
  };
  
  load() {
    return this.getHooks().then((hooks) => {
      hooks = hooks || [];
      hooks.forEach((hook) => {
        this.addHookToTriggers(hook);
      });
     });
  }
  
}

function wrapToHTTPRequest(hook) {
  return function(req, res) {
    var jsonBody = {};
    for(var i in req) {
      jsonBody[i] = req[i];
    }
    if (req.object) {
      jsonBody.object = req.object.toJSON();
      jsonBody.object.className = req.object.className;
    }
    if (req.original) {
      jsonBody.original = req.original.toJSON();
      jsonBody.original.className = req.original.className;
    }
    var jsonRequest = {};
    jsonRequest.headers = {
      'Content-Type': 'application/json'
    }
    jsonRequest.body = JSON.stringify(jsonBody);
    
    request.post(hook.url, jsonRequest, function(err, httpResponse, body){
      var result;
      if (body) {
        if (typeof body == "string") {
          try {
            body = JSON.parse(body);
          } catch(e) {
            err = {error: "Malformed response", code: -1};
          }
        }
        if (!err) {
          result = body.success;
          err  = body.error;
        }
      }
      if (err) {
        return res.error(err);
      } else {   
        return res.success(result);
      }
    });
  }
}

export default HooksController;
