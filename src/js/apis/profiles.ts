import Cookies from "js-cookie";

interface Profile {
  name: string;
  data: string;
  date: string;
}

interface CookieCollection {
  [cookieName: string]: string;
}

interface IDBItem {
  key?: IDBValidKey;
  value: any;
}

interface IDBStoreData {
  [storeName: string]: IDBItem[];
}

interface IDBDataExport {
  name: string;
  data: IDBStoreData;
}

interface ExportedData {
  idbData: string;
  localStorageData: string;
  cookies: CookieCollection;
}

interface CookiesInterface {
  get(): CookieCollection;
  set(name: string, value: string, options?: any): void;
  remove(name: string, options?: any): void;
}

class ProfilesAPI {
  private PROFILE_DB_NAME: string;
  private PROFILE_STORE_NAME: string;
  private cookies: CookiesInterface;
  private encryption: Profiles_DataEncryption;

  constructor() {
    this.PROFILE_DB_NAME = "profilesDB";
    this.PROFILE_STORE_NAME = "profiles";
    this.cookies = Cookies as CookiesInterface;
    this.encryption = new Profiles_DataEncryption();
  }

  async openDB(dbName: string, storeName: string): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request: IDBOpenDBRequest = indexedDB.open(dbName);
      request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
        const db: IDBDatabase = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(storeName)) {
          db.createObjectStore(storeName);
        }
      };
      request.onsuccess = (event: Event) =>
        resolve((event.target as IDBOpenDBRequest).result);
      request.onerror = (event: Event) =>
        reject((event.target as IDBOpenDBRequest).error);
    });
  }

  async init(): Promise<void> {
    const db = await this.openDB(this.PROFILE_DB_NAME, this.PROFILE_STORE_NAME);
    const tx = db.transaction(this.PROFILE_STORE_NAME, "readwrite");
    const store = tx.objectStore(this.PROFILE_STORE_NAME);
    const request = store.get("activeProfile");

    request.onsuccess = () => {
      if (!request.result) {
        store.put("", "activeProfile");
      }
    };
    await this._waitForRequest(request);
    db.close();
  }

  async createProfile(
    profileName: string,
    autoSelect: boolean = false,
  ): Promise<Profile> {
    const db = await this.openDB(this.PROFILE_DB_NAME, this.PROFILE_STORE_NAME);
    const tx = db.transaction(this.PROFILE_STORE_NAME, "readwrite");
    const store = tx.objectStore(this.PROFILE_STORE_NAME);

    const profile: Profile = {
      name: profileName,
      data: "",
      date: new Date().toISOString(),
    };

    const request = store.put(profile, profileName);
    await this._waitForRequest(request);

    if (autoSelect) {
      await this.setActiveProfile(profileName);
    }

    db.close();
    return profile;
  }

  async getProfile(profileName: string): Promise<Profile | null> {
    const db = await this.openDB(this.PROFILE_DB_NAME, this.PROFILE_STORE_NAME);
    const tx = db.transaction(this.PROFILE_STORE_NAME, "readonly");
    const store = tx.objectStore(this.PROFILE_STORE_NAME);

    const request = store.get(profileName);
    const profile = await this._waitForRequest(request);

    db.close();
    return profile || null;
  }

  async setActiveProfile(profileName: string): Promise<void> {
    const profile = await this.getProfile(profileName);
    if (!profile) {
      throw new Error(`Profile "${profileName}" does not exist.`);
    }

    await this.saveCurrentProfileData();

    const db = await this.openDB(this.PROFILE_DB_NAME, this.PROFILE_STORE_NAME);
    const tx = db.transaction(this.PROFILE_STORE_NAME, "readwrite");
    const store = tx.objectStore(this.PROFILE_STORE_NAME);
    const request = store.put(profileName, "activeProfile");
    await this._waitForRequest(request);
    db.close();

    await this.clearAllData();
    await this.importData(profile.data);
  }

  async getActiveProfile(): Promise<Profile | null> {
    const db = await this.openDB(this.PROFILE_DB_NAME, this.PROFILE_STORE_NAME);
    const tx = db.transaction(this.PROFILE_STORE_NAME, "readonly");
    const store = tx.objectStore(this.PROFILE_STORE_NAME);

    const request = store.get("activeProfile");
    const activeProfileName = (await this._waitForRequest(request)) as
      | string
      | null;

    db.close();
    return activeProfileName ? await this.getProfile(activeProfileName) : null;
  }

  async saveCurrentProfileData(): Promise<void> {
    let activeProfile = await this.getActiveProfile();
    console.log(activeProfile);
    if (activeProfile) {
      const data = await this.exportData();
      activeProfile.data = data;
      console.log(activeProfile);

      const db = await this.openDB(
        this.PROFILE_DB_NAME,
        this.PROFILE_STORE_NAME,
      );
      const tx = db.transaction(this.PROFILE_STORE_NAME, "readwrite");
      const store = tx.objectStore(this.PROFILE_STORE_NAME);
      const request = store.put(activeProfile, activeProfile.name);
      await this._waitForRequest(request);
      db.close();
    }
  }

  async clearAllData(): Promise<void> {
    localStorage.clear();
    const dbNames = await indexedDB.databases();
    for (const { name } of dbNames) {
      if (name !== this.PROFILE_DB_NAME && name) {
        await indexedDB.deleteDatabase(name);
      }
    }
    this.clearCookies();
  }

  clearCookies(): void {
    const allCookies = this.cookies.get();
    Object.keys(allCookies).forEach((cookieName) => {
      this.cookies.remove(cookieName, { path: "/" });
    });
    console.log("All cookies have been cleared!");
  }

  extractCookies(): CookieCollection {
    let cookies: CookieCollection = {};
    document.cookie.split(";").forEach((c) => {
      let parts = c.split("=");
      cookies[parts.shift()?.trim() || ""] = decodeURI(parts.join("="));
    });
    return cookies;
  }

  async getIDBData(databaseName: string): Promise<IDBDataExport> {
    return new Promise((resolve, reject) => {
      let dbRequest: IDBOpenDBRequest = indexedDB.open(databaseName);

      dbRequest.onsuccess = (event: Event) => {
        let db: IDBDatabase = (event.target as IDBOpenDBRequest).result;
        let transaction: IDBTransaction = db.transaction(
          db.objectStoreNames,
          "readonly",
        );
        let data: IDBStoreData = {};

        transaction.oncomplete = () => resolve({ name: databaseName, data });
        transaction.onerror = (event: Event) =>
          reject((event.target as IDBTransaction).error);

        for (let i = 0; i < db.objectStoreNames.length; i++) {
          let storeName = db.objectStoreNames[i];
          let objectStore = transaction.objectStore(storeName);
          let request = objectStore.openCursor();
          data[storeName] = [];

          request.onsuccess = (event: Event) => {
            let cursor: IDBCursorWithValue | null = (event.target as IDBRequest)
              .result;
            if (cursor) {
              data[storeName].push({
                key: cursor.primaryKey,
                value: cursor.value,
              });
              cursor.continue();
            }
          };

          request.onerror = (event: Event) =>
            reject((event.target as IDBRequest).error);
        }
      };

      dbRequest.onerror = (event: Event) =>
        reject((event.target as IDBOpenDBRequest).error);
    });
  }

  async getAllIDBData(): Promise<IDBDataExport[]> {
    const databases = await indexedDB.databases();
    let promises = databases
      .filter((dbInfo) => dbInfo.name !== this.PROFILE_DB_NAME && dbInfo.name)
      .map((dbInfo) => this.getIDBData(dbInfo.name!));

    return Promise.all(promises);
  }

  async exportData(): Promise<string> {
    const idbData = await this.getAllIDBData();
    let data: ExportedData = {
      idbData: JSON.stringify(idbData),
      localStorageData: JSON.stringify({ ...localStorage }),
      cookies: this.extractCookies(),
    };

    let jsonData = JSON.stringify(data);
    let encryptedData = this.encryption.base6xorEncrypt(jsonData);
    return encryptedData;
  }

  async importData(input: string): Promise<void> {
    try {
      let decryptedDataJSON = this.encryption.base6xorDecrypt(input);
      let decryptedData = JSON.parse(decryptedDataJSON) as ExportedData;

      let idbData = JSON.parse(decryptedData.idbData) as IDBDataExport[];
      let idbPromises = idbData.map((dbInfo) => {
        return this._importIDBData(dbInfo);
      });

      await Promise.all(idbPromises);

      localStorage.clear();
      let localStorageData = JSON.parse(
        decryptedData.localStorageData,
      ) as Record<string, string>;
      Object.keys(localStorageData).forEach((key) => {
        localStorage.setItem(key, localStorageData[key]);
      });

      this.clearCookies();
      Object.entries(decryptedData.cookies).forEach(
        ([cookieName, cookieValue]) => {
          this.cookies.set(cookieName, cookieValue);
        },
      );
    } catch (err) {
      console.error("Error importing data:", err);
    }
  }

  async _importIDBData(dbInfo: IDBDataExport): Promise<void> {
    return new Promise((resolve, reject) => {
      let dbRequest: IDBOpenDBRequest = indexedDB.open(dbInfo.name);

      dbRequest.onupgradeneeded = (event: IDBVersionChangeEvent) => {
        let db: IDBDatabase = (event.target as IDBOpenDBRequest).result;

        Object.keys(dbInfo.data).forEach((storeName) => {
          if (!db.objectStoreNames.contains(storeName)) {
            db.createObjectStore(storeName);
          }
        });
      };

      dbRequest.onsuccess = (event: Event) => {
        let db: IDBDatabase = (event.target as IDBOpenDBRequest).result;

        const storeNames = Object.keys(dbInfo.data);
        if (storeNames.length === 0) {
          resolve();
          return;
        }

        const existingStoreNames = storeNames.filter((name) =>
          db.objectStoreNames.contains(name),
        );

        if (existingStoreNames.length === 0) {
          resolve();
          return;
        }

        let transaction: IDBTransaction = db.transaction(
          existingStoreNames,
          "readwrite",
        );

        transaction.oncomplete = () => resolve();
        transaction.onerror = (event: Event) =>
          reject((event.target as IDBTransaction).error);

        existingStoreNames.forEach((storeName) => {
          let objectStore = transaction.objectStore(storeName);
          let storeData = dbInfo.data[storeName];

          const clearRequest = objectStore.clear();
          clearRequest.onsuccess = () => {
            storeData.forEach((item) => {
              if (item.key !== undefined) {
                objectStore.put(item.value, item.key);
              } else {
                objectStore.add(item.value);
              }
            });
          };
        });
      };

      dbRequest.onerror = (event: Event) =>
        reject((event.target as IDBOpenDBRequest).error);
    });
  }

  async _waitForRequest<T>(request: IDBRequest<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
}

class Profiles_DataEncryption {
  constructor() {}

  base6xorEncrypt(text: string): string {
    let output = "";
    for (let i = 0; i < text.length; i++) {
      let charCode = text.charCodeAt(i) ^ 2;
      output += String.fromCharCode(charCode);
    }
    return btoa(encodeURIComponent(output));
  }

  base6xorDecrypt(encryptedData: string): string {
    let decodedData = decodeURIComponent(atob(encryptedData));
    let output = "";
    for (let i = 0; i < decodedData.length; i++) {
      let charCode = decodedData.charCodeAt(i) ^ 2;
      output += String.fromCharCode(charCode);
    }
    return output;
  }
}

export { ProfilesAPI };
