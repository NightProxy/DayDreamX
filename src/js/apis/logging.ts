import localforage from "localforage";

class Logger {
  store: any;
  sessionId: string;

  constructor() {
    this.store = localforage.createInstance({
      name: "logs",
      storeName: "logs",
    });
    this.sessionId = this.getSessionId();
  }

  getSessionId() {
    const storedSessionId = sessionStorage.getItem("sessionId");
    if (storedSessionId) {
      return storedSessionId;
    } else {
      const newSessionId = this.generateSessionId();
      sessionStorage.setItem("sessionId", newSessionId);
      return newSessionId;
    }
  }

  generateSessionId() {
    const date = new Date();
    return `log-${date.toISOString()}`;
  }

  async createLog(message: string) {
    const log = await this.getLog(this.sessionId);
    if (log) {
      log.push({ timestamp: new Date().toISOString(), message });
      await this.store.setItem(this.sessionId, log);
    } else {
      await this.store.setItem(this.sessionId, [
        { timestamp: new Date().toISOString(), message },
      ]);
    }
  }

  async getLog(id: string) {
    return await this.store.getItem(id);
  }

  async editLog(id: string, index: number, newMessage: string) {
    const log = await this.getLog(id);
    if (log) {
      log[index].message = newMessage;
      await this.store.setItem(id, log);
    }
  }

  async exportLogs() {
    const logs = await this.store.keys();
    const exportData: Record<any, string> = {};

    for (const logId of logs) {
      exportData[logId] = await this.getLog(logId as string);
    }
    return exportData;
  }

  async clearAllLogs() {
    await this.store.clear(); // what huh
    sessionStorage.removeItem("sessionId");
  }

  async deleteLog(id: string) {
    await this.store.removeItem(id);
    if (id === this.sessionId) {
      sessionStorage.removeItem("sessionId");
    }
  }
}

export { Logger };
