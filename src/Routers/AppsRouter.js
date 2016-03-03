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
    if (req.params.applicationId) {
      return appsController.getApplication(req.params.applicationId, req.auth.config.masterKey).then( (foundApp) => {
        if (!foundApp) {
          throw new Parse.Error(143, `no app with id: ${req.params.applicationId} is defined`);
        }
        return Promise.resolve({response: foundApp});
      });
    }

    return appsController.getApplications().then((apps) => {
      return { response: apps || [] };
    }, (err) => {
      throw err;
    });
  }

  createApp(anApp, userId, config) {
    return config.appsController.createApp(anApp, userId).then( (app) => ({response: app}));
  };

  updateApp(anApp, userId, config) {
    return config.appsController.updateApp(anApp, userId).then((app) => ({response: app}));
  };

  handlePost(req) {
    var anApp = getAppObjectFromRequest(req.body);
    return this.createApp(anApp, req.auth.user.id, req.config);
  };

  getAppObjectFromRequest(body, applicationId) {
    var app = {}
    app.id = applicationId || null;
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
      var anApp = getAppObjectFromRequest(req.body, req.params.applicationId);
      return this.updateApp(anApp, req.auth.user.id, req.config);
    } else {
      throw new Parse.Error(143, "invalid application parameters");
    }
  };

  handleDelete(req) {
    var appsController = req.config.appsController;
    if (req.params.applicationId) {
      return appsController.deleteApp(req.params.applicationId).then(() => ({response: {}}))
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
