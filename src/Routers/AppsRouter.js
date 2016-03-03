import { Parse } from 'parse/node';
import PromiseRouter from '../PromiseRouter';
import { AppsController } from '../Controllers/AppsController';

function enforceMasterKeyAccess(req) {
  if (!req.auth.isMaster) {
    throw new Parse.Error(403, "unauthorized: master key is required");
  }
}

export class AppsRouter extends PromiseRouter {

  handleGet(req) {
    var appsController = req.config.appsController;
    var userId = req.auth.user.id;
    if (req.params.applicationId) {
      return appsController.getApplication(userId, req.params.applicationId).then( (foundApp) => {
        if (!foundApp) {
          throw new Parse.Error(143, `no app with id: ${req.params.applicationId} is defined`);
        }
        return Promise.resolve({response: foundApp});
      });
    }

    return appsController.getApplications(userId).then((apps) => {
      return { response: apps || [] };
    }, (err) => {
      throw err;
    });
  }

  handlePost(req) {
    var userId = req.auth.user.id;
    var anApp = getAppObjectFromRequest(req.body);
    return this.createApplication(userId, anApp, req.config);
  };

  getAppObjectFromRequest(body) {
    var app = {}
    var whitelistFields = [
        "appName", "clientClassCreationEnabled", "clientPushEnabled", "javascriptKey",
        "masterKey", "requireRevocableSessions", "restKey", "revokeSessionOnPasswordChange",
        "webhookKey", "windowsKey"
    ];
    whitelistFields.forEach(function(field) {
      app[field] = body[field] || null;
    });
    return app;
  };

  handleUpdate(req) {
    if (req.params.applicationId && req.body) {
      var userId = req.auth.user.id;
      var anApp = getAppObjectFromRequest(req.body);
      return this.updateApplication(userId, req.params.applicationId, anApp, req.config);
    } else {
      throw new Parse.Error(143, "invalid application parameters");
    }
  };

  handleDelete(req) {
    var appsController = req.config.appsController;
    var userId = req.auth.user.id;
    if (req.params.applicationId) {
      return appsController.deleteApplication(userId, req.params.applicationId).then(() => ({response: {}}))
    }
    return Promise.resolve({response: {}});
  };

  handlePut(req) {
    var body = req.body;
    if (body.__op == "Delete") {
      return this.handleDelete(req);
    } else {
      return this.handleUpdate(req);
    }
  }

  mountRoutes() {
    this.route('GET',  '/apps', enforceMasterKeyAccess, this.handleGet.bind(this));
    this.route('GET',  '/apps/:applicationId', enforceMasterKeyAccess, this.handleGet.bind(this));
    this.route('POST', '/apps', enforceMasterKeyAccess, this.handlePost.bind(this));
    this.route('PUT',  '/apps/:applicationId', enforceMasterKeyAccess, this.handlePut.bind(this));
    this.route('DELETE',  '/apps/:applicationId', enforceMasterKeyAccess, this.handleDelete.bind(this));
  }
}

export default AppsRouter;
