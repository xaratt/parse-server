// functions.js

var express = require('express'),
    Parse = require('parse/node').Parse,
    PromiseRouter = require('./PromiseRouter'),
    rest = require('./rest');

var router = new PromiseRouter();

function handleCloudFunction(req) {
  if (Parse.Cloud.Functions[req.params.functionName]) {
    if (Parse.Cloud.Validators[req.params.functionName]) {
      var result = Parse.Cloud.Validators[req.params.functionName](req.body || {});
      if (!result) {
        throw new Parse.Error(Parse.Error.SCRIPT_FAILED, 'Validation failed.');
      }
    }

    return new Promise(function (resolve, reject) {
      var response = createResponseObject(resolve, reject);
      var request = {
        params: req.body || {},
        master: req.auth && req.auth.isMaster,
        user: req.auth && req.auth.user,
      };
      Parse.Cloud.Functions[req.params.functionName](request, response);
    });
  } else {
    throw new Parse.Error(Parse.Error.SCRIPT_FAILED, 'function not found');
  }
}

function createResponseObject(resolve, reject) {
  return {
    success: function(result) {
      resolve({
        response: {
          result: Parse._encode(result)
        }
      });
    },
    error: function(error) {
      reject(new Parse.Error(Parse.Error.SCRIPT_FAILED, error));
    }
  }
}

router.route('POST', '/functions/:functionName', handleCloudFunction);


module.exports = router;
