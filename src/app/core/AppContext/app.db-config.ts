import { CatbeeIndexedDBConfig } from '@ng-catbee/indexed-db';

export const dbConfig: CatbeeIndexedDBConfig = {
  name: 'ElmAppDB',
  version: 24,
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
    {
      store: 'pdfDrafts',
      storeConfig: { keyPath: 'id', autoIncrement: false },
      storeSchema: [],
    },
    {
      store: 'wrongAnswersStore',
      storeConfig: { keyPath: 'id', autoIncrement: false },
      storeSchema: [
        { name: 'sessionId', keypath: 'sessionId', options: { unique: false } },
        { name: 'bankId', keypath: 'bankId', options: { unique: false } },
      ],
    },
    {
      store: 'linksStore',
      storeConfig: { keyPath: 'id', autoIncrement: false },
      storeSchema: [
        { name: 'sourceType', keypath: 'sourceType', options: { unique: false } },
      ],
    },
    // {
    //   store: 'encryptionKeys',
    //   storeConfig: { keyPath: 'id', autoIncrement: false },
    //   storeSchema: []
    // }
  ],
};
