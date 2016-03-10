import { Parse } from 'parse/node';
import PromiseRouter from '../PromiseRouter';
import { AccountController } from '../Controllers/AccountController';


function enforceLoggedUserAccess(req) {
  if (!req.auth.user) {
    throw new Parse.Error(403, "unauthorized: valid session key is required");
  }
  //console.log("AUTH USER ID", req.auth.user.id);
}

export class AccountRouter extends PromiseRouter {

  handleGetKeys(req) {
    var accountController = req.config.accountController;
    var userId = req.auth.user.id;
    return accountController.getKeys(userId).then((keys) => {
      return { response: keys || [] };
    }, (err) => {
      throw err;
    });
  }

  handlePostKeys(req) {
    var accountController = req.config.accountController;
    var userId = req.auth.user.id;
    var keyName = req.body.name;
    return accountController.createKey(userId, keyName).then((key) => {
      return { response: key || {} };
    }, (err) => {
      throw err;
    });
    //return '{"id":1358362,"name":"test111","token":"r1z8jQ9g3P6QYe731M0NzIWFL7dbD7xnB4eYIn9R","scope":"apps","expiresAt":"2017-03-09T22:21:03Z"}';
  }

  handleDeleteKeys(req) {
    var accountController = req.config.accountController;
    var userId = req.auth.user.id;
    var keyId = req.params.keyId;
    return accountController.deleteKey(userId, keyId).then((keyId) => {
        // TODO: check response from parse.com
      return { response: keyId || {} };
    }, (err) => {
      throw err;
    });
  }

  mountRoutes() {
    this.route('GET',  '/account/keys', enforceLoggedUserAccess, this.handleGetKeys.bind(this));
    this.route('POST', '/account/keys', enforceLoggedUserAccess, this.handlePostKeys.bind(this));
    this.route('DELETE',  '/account/keys/:keyId', enforceLoggedUserAccess, this.handleDeleteKeys.bind(this));
  }
}

export default AccountRouter;
