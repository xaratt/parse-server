var PushController = require('../src/Controllers/PushController').PushController;

describe('PushController', () => {
  it('can check valid master key of request', (done) => {
    // Make mock request
    var auth = {
      isMaster: true
    }

    expect(() => {
      PushController.validateMasterKey(auth);
    }).not.toThrow();
    done();
  });

  it('can check invalid master key of request', (done) => {
    // Make mock request
    var auth = {
      isMaster: false
    }

    expect(() => {
      PushController.validateMasterKey(auth);
    }).toThrow();
    done();
  });


  it('can validate device type when no device type is set', (done) => {
    // Make query condition
    var where = {
    };
    var validPushTypes = ['ios', 'android'];

    expect(function(){
      PushController.validatePushType(where, validPushTypes);
    }).not.toThrow();
    done();
  });

  it('can validate device type when single valid device type is set', (done) => {
    // Make query condition
    var where = {
      'deviceType': 'ios'
    };
    var validPushTypes = ['ios', 'android'];

    expect(function(){
      PushController.validatePushType(where, validPushTypes);
    }).not.toThrow();
    done();
  });

  it('can validate device type when multiple valid device types are set', (done) => {
    // Make query condition
    var where = {
      'deviceType': {
        '$in': ['android', 'ios']
      }
    };
    var validPushTypes = ['ios', 'android'];

    expect(function(){
      PushController.validatePushType(where, validPushTypes);
    }).not.toThrow();
    done();
  });

  it('can throw on validateDeviceType when single invalid device type is set', (done) => {
    // Make query condition
    var where = {
      'deviceType': 'osx'
    };
    var validPushTypes = ['ios', 'android'];

    expect(function(){
      PushController.validatePushType(where, validPushTypes);
    }).toThrow();
    done();
  });

  it('can throw on validateDeviceType when single invalid device type is set', (done) => {
    // Make query condition
    var where = {
      'deviceType': 'osx'
    };
    var validPushTypes = ['ios', 'android'];

    expect(function(){
      PushController.validatePushType(where, validPushTypes);
    }).toThrow();
    done();
  });

  it('can get expiration time in string format', (done) => {
    // Make mock request
    var timeStr = '2015-03-19T22:05:08Z';
    var body = {
        'expiration_time': timeStr
     }

    var time = PushController.getExpirationTime(body);
    expect(time).toEqual(new Date(timeStr).valueOf());
    done();
  });

  it('can get expiration time in number format', (done) => {
    // Make mock request
    var timeNumber = 1426802708;
    var body = {
      'expiration_time': timeNumber
    }

    var time = PushController.getExpirationTime(body);
    expect(time).toEqual(timeNumber * 1000);
    done();
  });

  it('can throw on getExpirationTime in invalid format', (done) => {
    // Make mock request
    var body = {
      'expiration_time': 'abcd'
    }

    expect(function(){
      PushController.getExpirationTime(body);
    }).toThrow();
    done();
  });

});
