import { Parse } from 'parse/node';
import PromiseRouter from '../PromiseRouter';
import { AccountController } from '../Controllers/AccountController';


function enforceSessionAccess(req) {
  if (!req.info.sessionToken) {
    throw new Parse.Error(403, "unauthorized: session key is required");
  }
  // TODO: validate session key
  console.log("AUTH USER ID", req.auth.user.id);
}
export class AccountRouter extends PromiseRouter {
  handlePostKeys(req) {
    var keyName = req.params.name;
    return '{"id":1358362,"name":"test111","token":"r1z8jQ9g3P6QYe731M0NzIWFL7dbD7xnB4eYIn9R","scope":"apps","expiresAt":"2017-03-09T22:21:03Z"}';
  }

  mountRoutes() {
    this.route('GET',  '/account/keys', enforceSessionAccess, this.handleGetKeys.bind(this));
    this.route('POST', '/account/keys', enforceSessionAccess, this.handlePostKeys.bind(this));
    this.route('DELETE',  '/account/keys/:keyId', enforceSessionAccess, this.handleDeleteKeys.bind(this));
  }
}

export default AccountRouter;
