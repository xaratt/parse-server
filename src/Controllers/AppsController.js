var DatabaseAdapter = require('../DatabaseAdapter'),
    triggers = require('../triggers'),
    request = require('request');
const collection = "_Apps";

export class AppsController {
    
  constructor(applicationId) {
    this.applicationId = applicationId;
  }

}

export default AppsController;
