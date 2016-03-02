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

  createApp(anApp, config) {
    return config.appsController.createApp(anApp).then( (app) => ({response: app}));
  };

  updateApp(anApp, config) {
    return config.appsController.updateApp(anApp).then((app) => ({response: app}));
  };

  handlePost(req) {
    return this.createHook(req.body, req.config);
  };

  createAppObjectFromRequest(applicationId, body) {
    var app = {}
    app.id = applicationId;
    //TODO
    // "appName": "<APPLICATION_NAME>",
    // "applicationId": "<APPLICATION_ID>",
    // "clientClassCreationEnabled": true,
    // "clientPushEnabled": false,
    // "dashboardURL": "https://www.parse.com/apps/yourapp",
    // "javascriptKey": "<JAVASCRIPT_KEY>",
    // "masterKey": "<MASTER_KEY>",
    // "requireRevocableSessions": true,
    // "restKey": "<REST_API_KEY>",
    // "revokeSessionOnPasswordChange": true,
    // "webhookKey": "<WEBHOOK_KEY>",
    // "windowsKey": "<WINDOWS_KEY>"
    // + user id
    return app;
  }

  handleUpdate(req) {
    var app;
    if (req.params.applicationId && req.body) {
      app = createAppObjectFromRequest(req.params.applicationId && req.body);
    } else {
      throw new Parse.Error(143, "invalid application parameters");
    }
    return this.updateApp(app, req.config);
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
