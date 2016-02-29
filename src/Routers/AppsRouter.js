import { Parse } from 'parse/node';
import PromiseRouter from '../PromiseRouter';
//import { AppsController } from '../Controllers/AppsController';

function enforceMasterKeyAccess(req) {
  if (!req.auth.isMaster) {
    throw new Parse.Error(403, "unauthorized: master key is required");
  }
}

export class AppsRouter extends PromiseRouter {

  handleGet(req) {
    var hooksController = req.config.hooksController;
    if (req.params.functionName) {
      return hooksController.getFunction(req.params.functionName).then( (foundFunction) => {
        if (!foundFunction) {
          throw new Parse.Error(143, `no function named: ${req.params.functionName} is defined`);
        }
        return Promise.resolve({response: foundFunction});
      });
    }
    
    return hooksController.getFunctions().then((functions) => {
      return { response: functions || [] };
    }, (err) => {
      throw err;
    });
  }

  createApp(app, config) {
    return config.hooksController.createHook(aHook).then( (hook) => ({response: hook}));
  };

  updateApp(aHook, config) {
    return  config.hooksController.updateHook(aHook).then((hook) => ({response: hook}));
  };

  handlePost(req) {
    return this.createHook(req.body, req.config);
  };

  handleUpdate(req) {
  };

  handleDelete(req) {
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
    this.route('POST', '/apps', enforceMasterKeyAccess, this.handlePost.bind(this));
    this.route('PUT',  '/apps', enforceMasterKeyAccess, this.handlePut.bind(this));
    this.route('DELETE',  '/apps', enforceMasterKeyAccess, this.handleDelete.bind(this));
  }
}

export default AppsRouter;
