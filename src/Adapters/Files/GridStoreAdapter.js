// GridStoreAdapter
//
// Stores files in Mongo using GridStore
// Requires the database adapter to be based on mongoclient

import { GridStore } from 'mongodb';
import { FilesAdapter } from './FilesAdapter';

export class GridStoreAdapter extends FilesAdapter {
  // For a given config object, filename, and data, store a file
  // Returns a promise
  createFile(config, filename, data, contentType) {
    var options = {};
    if (contentType) {
      options['content_type'] = contentType;
    }
    return config.database.connect().then(() => {
      let gridStore = new GridStore(config.database.db, filename, 'w', options);
      return gridStore.open();
    }).then((gridStore) => {
      return gridStore.write(data);
    }).then((gridStore) => {
      return gridStore.close();
    });
  }

  deleteFile(config, filename) {
    return config.database.connect().then(() => {
      let gridStore = new GridStore(config.database.db, filename, 'w');
      return gridStore.open();
    }).then((gridStore) => {
      return gridStore.unlink();
    }).then((gridStore) => {
      return gridStore.close();
    });
  }

  getFileData(config, filename) {
    var gridStore = null;
    return config.database.connect().then(() => {
      return GridStore.exist(config.database.db, filename);
    }).then(() => {
      gridStore = new GridStore(config.database.db, filename, 'r');
      return gridStore.open();
    }).then((gridStore) => {
      return gridStore.read().then((content) => {
        return {"content": content, "contentType": gridStore.contentType};
      });
    });
  }

  getFileLocation(config, filename) {
    return (config.mount + '/files/' + config.applicationId + '/' + encodeURIComponent(filename));
  }
}

export default GridStoreAdapter;
