// A bunch of different tests are in here - it isn't very thematic.
// It would probably be better to refactor them into different files.

var DatabaseAdapter = require('../src/DatabaseAdapter');
var request = require('request');

describe('miscellaneous', function() {
  it('create a GameScore object', function(done) {
    var obj = new Parse.Object('GameScore');
    obj.set('score', 1337);
    obj.save().then(function(obj) {
      expect(typeof obj.id).toBe('string');
      expect(typeof obj.createdAt.toGMTString()).toBe('string');
      done();
    }, function(err) { console.log(err); });
  });

  it('get a TestObject', function(done) {
    create({ 'bloop' : 'blarg' }, function(obj) {
      var t2 = new TestObject({ objectId: obj.id });
      t2.fetch({
        success: function(obj2) {
          expect(obj2.get('bloop')).toEqual('blarg');
          expect(obj2.id).toBeTruthy();
          expect(obj2.id).toEqual(obj.id);
          done();
        },
        error: fail
      });
    });
  });

  it('create a valid parse user', function(done) {
    createTestUser(function(data) {
      expect(data.id).not.toBeUndefined();
      expect(data.getSessionToken()).not.toBeUndefined();
      expect(data.get('password')).toBeUndefined();
      done();
    }, function(err) {
      console.log(err);
      fail(err);
    });
  });

  it('fail to create a duplicate username', function(done) {
    createTestUser(function(data) {
      createTestUser(function(data) {
        fail('Should not have been able to save duplicate username.');
      }, function(error) {
        expect(error.code).toEqual(Parse.Error.USERNAME_TAKEN);
        done();
      });
    });
  });

  it('succeed in logging in', function(done) {
    createTestUser(function(u) {
      expect(typeof u.id).toEqual('string');

      Parse.User.logIn('test', 'moon-y', {
        success: function(user) {
          expect(typeof user.id).toEqual('string');
          expect(user.get('password')).toBeUndefined();
          expect(user.getSessionToken()).not.toBeUndefined();
          Parse.User.logOut();
          done();
        }, error: function(error) {
          fail(error);
        }
      });
    }, fail);
  });

  it('increment with a user object', function(done) {
    createTestUser().then((user) => {
      user.increment('foo');
      return user.save();
    }).then(() => {
      return Parse.User.logIn('test', 'moon-y');
    }).then((user) => {
      expect(user.get('foo')).toEqual(1);
      user.increment('foo');
      return user.save();
    }).then(() => {
      Parse.User.logOut();
      return Parse.User.logIn('test', 'moon-y');
    }).then((user) => {
      expect(user.get('foo')).toEqual(2);
      Parse.User.logOut();
      done();
    }, (error) => {
      fail(error);
      done();
    });
  });

  it('save various data types', function(done) {
    var obj = new TestObject();
    obj.set('date', new Date());
    obj.set('array', [1, 2, 3]);
    obj.set('object', {one: 1, two: 2});
    obj.save().then(() => {
      var obj2 = new TestObject({objectId: obj.id});
      return obj2.fetch();
    }).then((obj2) => {
      expect(obj2.get('date') instanceof Date).toBe(true);
      expect(obj2.get('array') instanceof Array).toBe(true);
      expect(obj2.get('object') instanceof Array).toBe(false);
      expect(obj2.get('object') instanceof Object).toBe(true);
      done();
    });
  });

  it('query with limit', function(done) {
    var baz = new TestObject({ foo: 'baz' });
    var qux = new TestObject({ foo: 'qux' });
    baz.save().then(() => {
      return qux.save();
    }).then(() => {
      var query = new Parse.Query(TestObject);
      query.limit(1);
      return query.find();
    }).then((results) => {
      expect(results.length).toEqual(1);
      done();
    }, (error) => {
      fail(error);
      done();
    });
  });

  it('query without limit get default 100 records', function(done) {
    var objects = [];
    for (var i = 0; i < 150; i++) {
      objects.push(new TestObject({name: 'name' + i}));
    }
    Parse.Object.saveAll(objects).then(() => {
      return new Parse.Query(TestObject).find();
    }).then((results) => {
      expect(results.length).toEqual(100);
    done();
    }, (error) => {
      fail(error);
      done();
    });
  });

  it('basic saveAll', function(done) {
    var alpha = new TestObject({ letter: 'alpha' });
    var beta = new TestObject({ letter: 'beta' });
    Parse.Object.saveAll([alpha, beta]).then(() => {
      expect(alpha.id).toBeTruthy();
      expect(beta.id).toBeTruthy();
      return new Parse.Query(TestObject).find();
    }).then((results) => {
      expect(results.length).toEqual(2);
      done();
    }, (error) => {
      fail(error);
      done();
    });
  });

  it('test cloud function', function(done) {
    Parse.Cloud.run('hello', {}, function(result) {
      expect(result).toEqual('Hello world!');
      done();
    });
  });

  it('basic beforeSave rejection', function(done) {
    var obj = new Parse.Object('BeforeSaveFail');
    obj.set('foo', 'bar');
    obj.save().then(() => {
      fail('Should not have been able to save BeforeSaveFailure class.');
      done();
    }, () => {
      done();
    })
  });

  it('basic beforeSave rejection via promise', function(done) {
    var obj = new Parse.Object('BeforeSaveFailWithPromise');
    obj.set('foo', 'bar');
    obj.save().then(function() {
      fail('Should not have been able to save BeforeSaveFailure class.');
      done();
    }, function(error) {
      expect(error.code).toEqual(Parse.Error.SCRIPT_FAILED);
      expect(error.message).toEqual('Nope');

      done();
    })
  });

  it('test beforeSave unchanged success', function(done) {
    var obj = new Parse.Object('BeforeSaveUnchanged');
    obj.set('foo', 'bar');
    obj.save().then(function() {
      done();
    }, function(error) {
      fail(error);
      done();
    });
  });

  it('test beforeSave changed object success', function(done) {
    var obj = new Parse.Object('BeforeSaveChanged');
    obj.set('foo', 'bar');
    obj.save().then(function() {
      var query = new Parse.Query('BeforeSaveChanged');
      query.get(obj.id).then(function(objAgain) {
        expect(objAgain.get('foo')).toEqual('baz');
        done();
      }, function(error) {
        fail(error);
        done();
      });
    }, function(error) {
      fail(error);
      done();
    });
  });

  it('test afterSave ran and created an object', function(done) {
    var obj = new Parse.Object('AfterSaveTest');
    obj.save();

    setTimeout(function() {
      var query = new Parse.Query('AfterSaveProof');
      query.equalTo('proof', obj.id);
      query.find().then(function(results) {
        expect(results.length).toEqual(1);
        done();
      }, function(error) {
        fail(error);
        done();
      });
    }, 500);
  });

  it('test beforeSave happens on update', function(done) {
    var obj = new Parse.Object('BeforeSaveChanged');
    obj.set('foo', 'bar');
    obj.save().then(function() {
      obj.set('foo', 'bar');
      return obj.save();
    }).then(function() {
      var query = new Parse.Query('BeforeSaveChanged');
      return query.get(obj.id).then(function(objAgain) {
        expect(objAgain.get('foo')).toEqual('baz');
        done();
      });
    }, function(error) {
      fail(error);
      done();
    });
  });

  it('test beforeDelete failure', function(done) {
    var obj = new Parse.Object('BeforeDeleteFail');
    var id;
    obj.set('foo', 'bar');
    obj.save().then(() => {
      id = obj.id;
      return obj.destroy();
    }).then(() => {
      fail('obj.destroy() should have failed, but it succeeded');
      done();
    }, (error) => {
      expect(error.code).toEqual(Parse.Error.SCRIPT_FAILED);
      expect(error.message).toEqual('Nope');

      var objAgain = new Parse.Object('BeforeDeleteFail', {objectId: id});
      return objAgain.fetch();
    }).then((objAgain) => {
      expect(objAgain.get('foo')).toEqual('bar');
      done();
    }, (error) => {
      // We should have been able to fetch the object again
      fail(error);
    });
  })

  it('basic beforeDelete rejection via promise', function(done) {
    var obj = new Parse.Object('BeforeDeleteFailWithPromise');
    obj.set('foo', 'bar');
    obj.save().then(function() {
      fail('Should not have been able to save BeforeSaveFailure class.');
      done();
    }, function(error) {
      expect(error.code).toEqual(Parse.Error.SCRIPT_FAILED);
      expect(error.message).toEqual('Nope');

      done();
    })
  });

  it('test beforeDelete success', function(done) {
    var obj = new Parse.Object('BeforeDeleteTest');
    obj.set('foo', 'bar');
    obj.save().then(function() {
      return obj.destroy();
    }).then(function() {
      var objAgain = new Parse.Object('BeforeDeleteTest', obj.id);
      return objAgain.fetch().then(fail, done);
    }, function(error) {
      fail(error);
      done();
    });
  });

  it('test afterDelete ran and created an object', function(done) {
    var obj = new Parse.Object('AfterDeleteTest');
    obj.save().then(function() {
      obj.destroy();
    });

    setTimeout(function() {
      var query = new Parse.Query('AfterDeleteProof');
      query.equalTo('proof', obj.id);
      query.find().then(function(results) {
        expect(results.length).toEqual(1);
        done();
      }, function(error) {
        fail(error);
        done();
      });
    }, 500);
  });

  it('test save triggers get user', function(done) {
    var user = new Parse.User();
    user.set("password", "asdf");
    user.set("email", "asdf@example.com");
    user.set("username", "zxcv");
    user.signUp(null, {
      success: function() {
        var obj = new Parse.Object('SaveTriggerUser');
        obj.save().then(function() {
          done();
        }, function(error) {
          fail(error);
          done();
        });
      }
    });
  });

  it('test cloud function return types', function(done) {
    Parse.Cloud.run('foo').then((result) => {
      expect(result.object instanceof Parse.Object).toBeTruthy();
      expect(result.object.className).toEqual('Foo');
      expect(result.object.get('x')).toEqual(2);
      var bar = result.object.get('relation');
      expect(bar instanceof Parse.Object).toBeTruthy();
      expect(bar.className).toEqual('Bar');
      expect(bar.get('x')).toEqual(3);
      expect(Array.isArray(result.array)).toEqual(true);
      expect(result.array[0] instanceof Parse.Object).toBeTruthy();
      expect(result.array[0].get('x')).toEqual(2);
      done();
    });
  });

  it('test rest_create_app', function(done) {
    var appId;
    Parse._request('POST', 'rest_create_app').then((res) => {
      expect(typeof res.application_id).toEqual('string');
      expect(res.master_key).toEqual('master');
      appId = res.application_id;
      Parse.initialize(appId, 'unused');
      var obj = new Parse.Object('TestObject');
      obj.set('foo', 'bar');
      return obj.save();
    }).then(() => {
      var db = DatabaseAdapter.getDatabaseConnection(appId);
      return db.mongoFind('TestObject', {}, {});
    }).then((results) => {
      expect(results.length).toEqual(1);
      expect(results[0]['foo']).toEqual('bar');
      done();
    });
  });

  it('test beforeSave get full object on create and update', function(done) {
    var triggerTime = 0;
    // Register a mock beforeSave hook
    Parse.Cloud.beforeSave('GameScore', function(req, res) {
      var object = req.object;
      expect(object instanceof Parse.Object).toBeTruthy();
      expect(object.get('fooAgain')).toEqual('barAgain');
      expect(object.id).not.toBeUndefined();
      expect(object.createdAt).not.toBeUndefined();
      expect(object.updatedAt).not.toBeUndefined();
      if (triggerTime == 0) {
        // Create
        expect(object.get('foo')).toEqual('bar');
      } else if (triggerTime == 1) {
        // Update
        expect(object.get('foo')).toEqual('baz');
      } else {
        res.error();
      }
      triggerTime++;
      res.success();
    });

    var obj = new Parse.Object('GameScore');
    obj.set('foo', 'bar');
    obj.set('fooAgain', 'barAgain');
    obj.save().then(function() {
      // We only update foo
      obj.set('foo', 'baz');
      return obj.save();
    }).then(function() {
      // Make sure the checking has been triggered
      expect(triggerTime).toBe(2);
      // Clear mock beforeSave
      delete Parse.Cloud.Triggers.beforeSave.GameScore;
      done();
    }, function(error) {
      fail(error);
      done();
    });
  });

  it('test afterSave get full object on create and update', function(done) {
    var triggerTime = 0;
    // Register a mock beforeSave hook
    Parse.Cloud.afterSave('GameScore', function(req, res) {
      var object = req.object;
      expect(object instanceof Parse.Object).toBeTruthy();
      expect(object.get('fooAgain')).toEqual('barAgain');
      expect(object.id).not.toBeUndefined();
      expect(object.createdAt).not.toBeUndefined();
      expect(object.updatedAt).not.toBeUndefined();
      if (triggerTime == 0) {
        // Create
        expect(object.get('foo')).toEqual('bar');
      } else if (triggerTime == 1) {
        // Update
        expect(object.get('foo')).toEqual('baz');
      } else {
        res.error();
      }
      triggerTime++;
      res.success();
    });

    var obj = new Parse.Object('GameScore');
    obj.set('foo', 'bar');
    obj.set('fooAgain', 'barAgain');
    obj.save().then(function() {
      // We only update foo
      obj.set('foo', 'baz');
      return obj.save();
    }).then(function() {
      // Make sure the checking has been triggered
      expect(triggerTime).toBe(2);
      // Clear mock afterSave
      delete Parse.Cloud.Triggers.afterSave.GameScore;
      done();
    }, function(error) {
      fail(error);
      done();
    });
  });

  it('test beforeSave get original object on update', function(done) {
    var triggerTime = 0;
    // Register a mock beforeSave hook
    Parse.Cloud.beforeSave('GameScore', function(req, res) {
      var object = req.object;
      expect(object instanceof Parse.Object).toBeTruthy();
      expect(object.get('fooAgain')).toEqual('barAgain');
      expect(object.id).not.toBeUndefined();
      expect(object.createdAt).not.toBeUndefined();
      expect(object.updatedAt).not.toBeUndefined();
      var originalObject = req.original;
      if (triggerTime == 0) {
        // Create
        expect(object.get('foo')).toEqual('bar');
        // Check the originalObject is undefined
        expect(originalObject).toBeUndefined();
      } else if (triggerTime == 1) {
        // Update
        expect(object.get('foo')).toEqual('baz');
        // Check the originalObject
        expect(originalObject instanceof Parse.Object).toBeTruthy();
        expect(originalObject.get('fooAgain')).toEqual('barAgain');
        expect(originalObject.id).not.toBeUndefined();
        expect(originalObject.createdAt).not.toBeUndefined();
        expect(originalObject.updatedAt).not.toBeUndefined();
        expect(originalObject.get('foo')).toEqual('bar');
      } else {
        res.error();
      }
      triggerTime++;
      res.success();
    });

    var obj = new Parse.Object('GameScore');
    obj.set('foo', 'bar');
    obj.set('fooAgain', 'barAgain');
    obj.save().then(function() {
      // We only update foo
      obj.set('foo', 'baz');
      return obj.save();
    }).then(function() {
      // Make sure the checking has been triggered
      expect(triggerTime).toBe(2);
      // Clear mock beforeSave
      delete Parse.Cloud.Triggers.beforeSave.GameScore;
      done();
    }, function(error) {
      fail(error);
      done();
    });
  });

  it('test afterSave get original object on update', function(done) {
    var triggerTime = 0;
    // Register a mock beforeSave hook
    Parse.Cloud.afterSave('GameScore', function(req, res) {
      var object = req.object;
      expect(object instanceof Parse.Object).toBeTruthy();
      expect(object.get('fooAgain')).toEqual('barAgain');
      expect(object.id).not.toBeUndefined();
      expect(object.createdAt).not.toBeUndefined();
      expect(object.updatedAt).not.toBeUndefined();
      var originalObject = req.original;
      if (triggerTime == 0) {
        // Create
        expect(object.get('foo')).toEqual('bar');
        // Check the originalObject is undefined
        expect(originalObject).toBeUndefined();
      } else if (triggerTime == 1) {
        // Update
        expect(object.get('foo')).toEqual('baz');
        // Check the originalObject
        expect(originalObject instanceof Parse.Object).toBeTruthy();
        expect(originalObject.get('fooAgain')).toEqual('barAgain');
        expect(originalObject.id).not.toBeUndefined();
        expect(originalObject.createdAt).not.toBeUndefined();
        expect(originalObject.updatedAt).not.toBeUndefined();
        expect(originalObject.get('foo')).toEqual('bar');
      } else {
        res.error();
      }
      triggerTime++;
      res.success();
    });

    var obj = new Parse.Object('GameScore');
    obj.set('foo', 'bar');
    obj.set('fooAgain', 'barAgain');
    obj.save().then(function() {
      // We only update foo
      obj.set('foo', 'baz');
      return obj.save();
    }).then(function() {
      // Make sure the checking has been triggered
      expect(triggerTime).toBe(2);
      // Clear mock afterSave
      delete Parse.Cloud.Triggers.afterSave.GameScore;
      done();
    }, function(error) {
      fail(error);
      done();
    });
  });

  it('test cloud function error handling', (done) => {
    // Register a function which will fail
    Parse.Cloud.define('willFail', (req, res) => {
      res.error('noway');
    });
    Parse.Cloud.run('willFail').then((s) => {
      fail('Should not have succeeded.');
      delete Parse.Cloud.Functions['willFail'];
      done();
    }, (e) => {
      expect(e.code).toEqual(141);
      expect(e.message).toEqual('noway');
      delete Parse.Cloud.Functions['willFail'];
      done();
    });
  });

  it('test cloud function query parameters', (done) => {
    Parse.Cloud.define('echoParams', (req, res) => {
      res.success(req.params);
    });
    var headers = {
      'Content-Type': 'application/json',
      'X-Parse-Application-Id': 'test',
      'X-Parse-Javascript-Key': 'test'
    };
    request.post({
      headers: headers,
      url: 'http://localhost:8378/1/functions/echoParams', //?option=1&other=2
      qs: {
        option: 1,
        other: 2
      },
      body: '{"foo":"bar", "other": 1}'
    }, (error, response, body) => {
      expect(error).toBe(null);
      var res = JSON.parse(body).result;
      expect(res.option).toEqual('1');
      // Make sure query string params override body params
      expect(res.other).toEqual('2');
      expect(res.foo).toEqual("bar");
      delete Parse.Cloud.Functions['echoParams'];
      done();
    });
  });

  it('test cloud function parameter validation success', (done) => {
    // Register a function with validation
    Parse.Cloud.define('functionWithParameterValidation', (req, res) => {
      res.success('works');
    }, (request) => {
      return request.params.success === 100;
    });

    Parse.Cloud.run('functionWithParameterValidation', {"success":100}).then((s) => {
      delete Parse.Cloud.Functions['functionWithParameterValidation'];
      done();
    }, (e) => {
      fail('Validation should not have failed.');
      done();
    });
  });

  it('test cloud function parameter validation', (done) => {
    // Register a function with validation
    Parse.Cloud.define('functionWithParameterValidationFailure', (req, res) => {
      res.success('noway');
    }, (request) => {
      return request.params.success === 100;
    });

    Parse.Cloud.run('functionWithParameterValidationFailure', {"success":500}).then((s) => {
      fail('Validation should not have succeeded');
      delete Parse.Cloud.Functions['functionWithParameterValidationFailure'];
      done();
    }, (e) => {
      expect(e.code).toEqual(141);
      expect(e.message).toEqual('Validation failed.');
      done();
    });
  });

  it('fails on invalid client key', done => {
    var headers = {
      'Content-Type': 'application/octet-stream',
      'X-Parse-Application-Id': 'test',
      'X-Parse-Client-Key': 'notclient'
    };
    request.get({
      headers: headers,
      url: 'http://localhost:8378/1/classes/TestObject'
    }, (error, response, body) => {
      expect(error).toBe(null);
      var b = JSON.parse(body);
      expect(b.error).toEqual('unauthorized');
      done();
    });
  });

  it('fails on invalid windows key', done => {
    var headers = {
      'Content-Type': 'application/octet-stream',
      'X-Parse-Application-Id': 'test',
      'X-Parse-Windows-Key': 'notwindows'
    };
    request.get({
      headers: headers,
      url: 'http://localhost:8378/1/classes/TestObject'
    }, (error, response, body) => {
      expect(error).toBe(null);
      var b = JSON.parse(body);
      expect(b.error).toEqual('unauthorized');
      done();
    });
  });

  it('fails on invalid javascript key', done => {
    var headers = {
      'Content-Type': 'application/octet-stream',
      'X-Parse-Application-Id': 'test',
      'X-Parse-Javascript-Key': 'notjavascript'
    };
    request.get({
      headers: headers,
      url: 'http://localhost:8378/1/classes/TestObject'
    }, (error, response, body) => {
      expect(error).toBe(null);
      var b = JSON.parse(body);
      expect(b.error).toEqual('unauthorized');
      done();
    });
  });

  it('fails on invalid rest api key', done => {
    var headers = {
      'Content-Type': 'application/octet-stream',
      'X-Parse-Application-Id': 'test',
      'X-Parse-REST-API-Key': 'notrest'
    };
    request.get({
      headers: headers,
      url: 'http://localhost:8378/1/classes/TestObject'
    }, (error, response, body) => {
      expect(error).toBe(null);
      var b = JSON.parse(body);
      expect(b.error).toEqual('unauthorized');
      done();
    });
  });

  it('fails on invalid function', done => {
    Parse.Cloud.run('somethingThatDoesDefinitelyNotExist').then((s) => {
      fail('This should have never suceeded');
      done();
    }, (e) => {
      expect(e.code).toEqual(Parse.Error.SCRIPT_FAILED);
      expect(e.message).toEqual('Invalid function.');
      done();
    });
  });

});
