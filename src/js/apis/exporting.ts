class DataExportAPI {
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
  extractCookies(): { [key: string]: string } {
    const cookies: { [key: string]: string } = {};
    document.cookie.split(";").forEach((c) => {
      const parts = c.split("=");
      const key = parts.shift()?.trim() ?? "";
      cookies[key] = decodeURI(parts.join("="));
    });
    return cookies;
  }

  async getIDBData(databaseName: string): Promise<{
    name: string;
    data: { [storeName: string]: Array<{ key: IDBValidKey; value: any }> };
  }> {
    return new Promise((resolve, reject) => {
      const dbRequest = indexedDB.open(databaseName);

      dbRequest.onsuccess = (event: Event) => {
        const target = event.target as IDBOpenDBRequest;
        if (!target) {
          reject(new Error("No event target"));
          return;
        }
        const db = target.result;
        const transaction = db.transaction(db.objectStoreNames, "readonly");
        const data: {
          [storeName: string]: Array<{ key: IDBValidKey; value: any }>;
        } = {};

        transaction.oncomplete = () => {
          resolve({ name: databaseName, data });
        };

        transaction.onerror = (event: Event) => {
          const target = event.target as IDBTransaction;
          reject(target?.error);
        };

        for (const storeName of db.objectStoreNames) {
          const objectStore = transaction.objectStore(storeName);
          const request = objectStore.openCursor();
          data[storeName] = [];

          request.onsuccess = (event: Event) => {
            const cursor = (event.target as IDBRequest)
              .result as IDBCursorWithValue | null;
            if (cursor) {
              data[storeName].push({
                key: cursor.primaryKey,
                value: cursor.value,
              });
              cursor.continue();
            }
          };

          request.onerror = (event: Event) => {
            const target = event.target as IDBRequest;
            reject(target?.error);
          };
        }
      };

      dbRequest.onerror = (event: Event) => {
        const target = event.target as IDBOpenDBRequest;
        reject(target?.error);
      };
    });
  }

  decodeBase64(dataUrl: string): string {
    const base64String = dataUrl.split(",")[1];
    return window.atob(base64String);
  }

  getAllIDBData(): Promise<
    Array<{
      name: string;
      data: { [storeName: string]: Array<{ key: IDBValidKey; value: any }> };
    }>
  > {
    return indexedDB.databases().then((databases) => {
      const promises = databases.map((dbInfo) => this.getIDBData(dbInfo.name!));
      return Promise.all(promises);
    });
  }

  exportData(fileName: string): void {
    this.getAllIDBData()
      .then((idbData) => {
        const data = {
          idbData: JSON.stringify(idbData),
          localStorageData: JSON.stringify({ ...localStorage }),
          cookies: this.extractCookies(),
        };

        const jsonData = JSON.stringify(data);
        const encryptedData = this.base6xorEncrypt(jsonData);

        const blob = new Blob([encryptedData], {
          type: "application/octet-stream",
        });

        // @ts-ignore: msSaveOrOpenBlob is IE/Edge only
        if ((window.navigator as any).msSaveOrOpenBlob) {
          // @ts-ignore: msSaveBlob is IE/Edge only
          (window.navigator as any).msSaveBlob(blob, fileName);
        } else {
          const a = document.createElement("a");
          a.href = URL.createObjectURL(blob);
          a.download = fileName;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
        }
      })
      .catch((err) => {
        console.error("An error occurred during the export of data:", err);
      });
  }

  importData(input: HTMLInputElement): void {
    const fileInput = input;
    const file = fileInput.files?.[0];
    if (!file) return;
    const reader = new FileReader();

    reader.onload = (e: ProgressEvent<FileReader>) => {
      try {
        const result = e.target?.result;
        if (typeof result !== "string") throw new Error("File read error");
        const decryptedDataJSON = this.base6xorDecrypt(result);
        const decryptedData = JSON.parse(decryptedDataJSON);

        const idbData = JSON.parse(decryptedData.idbData);
        const idbPromises = idbData.map((dbInfo: any) => {
          return new Promise<void>((resolve, reject) => {
            const dbRequest = indexedDB.open(dbInfo.name);

            dbRequest.onsuccess = (event: Event) => {
              const target = event.target as IDBOpenDBRequest;
              if (!target) {
                reject(new Error("No event target"));
                return;
              }
              const db = target.result;
              const transaction = db.transaction(
                db.objectStoreNames,
                "readwrite",
              );

              transaction.oncomplete = () => {
                resolve();
              };

              transaction.onerror = (event: Event) => {
                const target = event.target as IDBTransaction;
                reject(target?.error);
              };

              for (const storeName of db.objectStoreNames) {
                const objectStore = transaction.objectStore(storeName);
                const storeData = dbInfo.data[storeName];

                objectStore.clear().onsuccess = () => {
                  storeData.forEach(
                    (item: { key?: IDBValidKey; value: any }) => {
                      if (item.key !== undefined) {
                        objectStore.put(item.value, item.key);
                      } else {
                        objectStore.add(item.value);
                      }
                    },
                  );
                };
              }
            };

            dbRequest.onerror = (event: Event) => {
              const target = event.target as IDBOpenDBRequest;
              reject(target?.error);
            };
          });
        });

        localStorage.clear();
        const localStorageData = JSON.parse(decryptedData.localStorageData);
        for (const key in localStorageData) {
          localStorage.setItem(key, localStorageData[key]);
        }

        document.cookie.split(";").forEach((c) => {
          document.cookie = c
            .replace(/^ +/, "")
            .replace(
              /=.*/,
              "=;expires=" + new Date().toUTCString() + ";path=/",
            );
        });

        const cookieData = decryptedData.cookies;
        for (const key in cookieData) {
          document.cookie = key + "=" + cookieData[key] + ";path=/";
        }

        Promise.all(idbPromises)
          .then(() => {
            window.location.reload();
          })
          .catch((err) => {
            console.error("An error occurred during the import of data:", err);
          });
      } catch (error) {
        console.error("Error during import:", error);
        alert(
          "An error occurred during the import of data. Please ensure the file is correct and try again.",
        );
      }
    };

    reader.readAsText(file);
  }
}

export { DataExportAPI };
