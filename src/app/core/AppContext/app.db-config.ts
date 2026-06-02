import { CatbeeIndexedDBConfig } from '@ng-catbee/indexed-db';

export const dbConfig: CatbeeIndexedDBConfig = {
  name: 'ElmAppDB',
  version: 21,
  objectStoresMeta: [
    {
      store: 'authStore',
      storeConfig: { keyPath: 'id', autoIncrement: false },
      storeSchema: [],
    },
    {
      store: 'settingsStore',
      storeConfig: { keyPath: 'id', autoIncrement: false },
      storeSchema: [],
    },
    // {
    //   store: 'encryptionKeys',
    //   storeConfig: { keyPath: 'id', autoIncrement: false },
    //   storeSchema: []
    // }
  ],
};
