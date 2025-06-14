import localforage from "localforage";

class SettingsAPI {
  store: any;

  constructor() {
    this.store = localforage.createInstance({
      name: "settings",
      storeName: "settings",
    });
  }

  async getItem(key: String) {
    return await this.store.getItem(key);
  }

  async setItem(key: String, value: String) {
    return await this.store.setItem(key, value);
  }

  async removeItem(key: String) {
    return await this.store.removeItem(key);
  }

  async clearAllSettings() {
    return await this.store.clear();
  }
}

export { SettingsAPI };
