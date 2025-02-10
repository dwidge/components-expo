import {
  AsyncDispatch,
  AsyncState,
  SetStateActionAsync,
  useAsyncState,
} from "@dwidge/hooks-react";
import * as FileSystem from "expo-file-system";
import { useCallback, useEffect } from "react";
import { Platform } from "react-native";
import { asDataUri, DataUri } from "../uri";

/**
 * Interface for local URI storage operations.
 */
interface Storage {
  getUri: (id: string) => Promise<DataUri | null>;
  setUri: (id: string, uri: DataUri | null) => Promise<DataUri | null>;
  deleteUri: (id: string) => Promise<null>;
  getIds: () => Promise<string[]>;
}

function assertStorageAvailable(
  storageName: string,
  condition: boolean,
): asserts condition {
  if (!condition) {
    throw new Error(`${storageName} is not available in this environment.`);
  }
}

/**
 * Hook to determine the appropriate local URI storage based on the platform.
 * @returns An object conforming to the Storage interface, or undefined if no storage available.
 */
export const usePlatformLocalStorage = (scope = ""): Storage | undefined => {
  if (Platform.OS === "web") {
    if (typeof indexedDB !== "undefined") return new IndexedDBStorage(scope);
  } else {
    // Native (Expo)
    if (FileSystem.documentDirectory) return new ExpoFileStorage(scope);
  }
};

/**
 * A hook to get and set a local Data URI, persisted using provided storage method.
 *
 * When `id` is undefined, the hook returns `undefined`, indicating no URI is being managed.
 * When `id` is defined, it returns an AsyncState array:
 *   - The first element is the current Data URI, which can be:
 *     - `undefined`: when the URI is being loaded.
 *     - `null`: if no URI is stored for the given `id`.
 *     - `DataUri (string)`: the stored Data URI.
 *   - The second element is an asynchronous dispatch function to set the Data URI.
 *     - Setting the URI will persist it in storage.
 *     - Setting the URI to `null` will delete the persisted URI.
 *
 * @param id (optional) The identifier for the Data URI. If undefined, the hook is effectively disabled and returns `undefined`.
 * @param storage (optional) Custom storage implementation. Defaults to platform-specific storage.
 * @returns An AsyncState array containing the DataUri and setter, or `undefined` if id is `undefined` or storage is not available.
 */
export const useLocalUri = (
  id: string | undefined,
  storage: Storage | undefined = usePlatformLocalStorage(),
): AsyncState<DataUri | null> | undefined => {
  const s = useAsyncState<DataUri | null>(null);
  const [value, setValue] = s;

  const getter = useCallback(async () => {
    if (!id) throw new Error("ID is undefined, cannot get local URI.");
    if (!storage)
      throw new Error("storage is undefined, cannot get local URI.");

    try {
      return await storage.getUri(id);
    } catch (error: any) {
      if (
        error.message.includes("file not found") ||
        error.message.includes("does not exist") ||
        error.message.includes("NotFound") ||
        error.message.includes("ENOENT")
      ) {
        return null;
      }
      throw error;
    }
  }, [id, storage?.getUri]);

  const setter: AsyncDispatch<DataUri | null> = useCallback(
    async (action: SetStateActionAsync<DataUri | null>) => {
      if (!id) throw new Error("ID is undefined, cannot set local URI.");
      if (!storage)
        throw new Error("storage is undefined, cannot set local URI.");

      let nextUri: SetStateActionAsync<DataUri | null>;
      if (typeof action === "function") {
        nextUri = (
          action as (
            prevState: DataUri | null,
          ) => DataUri | null | Promise<DataUri | null>
        )(value === undefined ? null : value);
      } else {
        nextUri = action;
      }

      const resolvedUri = await nextUri;
      await storage.setUri(id, resolvedUri);
      return resolvedUri;
    },
    [id, value, storage?.setUri],
  );

  useEffect(() => {
    if (id !== undefined && setValue && storage) {
      setValue(getter);
    }
  }, [id, setValue, storage, getter]);

  if (id === undefined) return; // Disabled
  if (!storage) return; // Storage unavailable
  return [value, setter];
};

/**
 * Hook to get a list of IDs of locally stored URIs.
 * @param storage (optional) Custom storage implementation. Defaults to platform-specific storage.
 * @returns A tuple of an array, or `undefined` if storage is not available.
 *   - The first element is the current array of IDs, which can be:
 *     - `undefined`: when the IDs are being loaded.
 *     - `string[]`: an array of IDs of stored URIs, or an empty array if none are stored.
 */
export const useLocalUriIds = (
  storage: Storage | undefined = usePlatformLocalStorage(),
): [string[] | undefined] | undefined => {
  const s = useAsyncState<string[]>([]);
  const [ids, setIds] = s;

  const getter = useCallback(async () => {
    if (!storage)
      throw new Error("storage is undefined, cannot get local URI IDs.");
    return await storage.getIds();
  }, [storage?.getIds]);

  useEffect(() => {
    if (setIds && storage) setIds(getter);
  }, [setIds, storage, getter]);

  if (!storage) return; // Storage unavailable
  return [ids];
};

class IndexedDBStorage implements Storage {
  private objectStoreName: string;
  constructor(scope: string = "") {
    this.objectStoreName = scope || "data";
  }

  async getUri(id: string): Promise<DataUri | null> {
    assertStorageAvailable("IndexedDB", typeof indexedDB !== "undefined");
    return new Promise((resolve, reject) => {
      const request = indexedDB.open("localUriDB", 1);

      request.onerror = (event) => {
        reject(
          new Error(
            `IndexedDB error: ${(event.target as IDBRequest)?.error?.message}`,
          ),
        );
      };

      request.onsuccess = (event) => {
        const db = (event.target as IDBRequest<IDBDatabase>).result;
        const transaction = db.transaction([this.objectStoreName], "readonly");
        const store = transaction.objectStore(this.objectStoreName);
        const getRequest = store.get(id);

        getRequest.onsuccess = (event) => {
          const result = (event.target as IDBRequest<DataUri>).result;
          resolve(result || null);
        };

        getRequest.onerror = (event) => {
          reject(
            new Error(
              `IndexedDB get error: ${(event.target as IDBRequest)?.error?.message}`,
            ),
          );
        };

        transaction.onerror = (event) => {
          reject(
            new Error(
              `IndexedDB transaction error: ${(event.target as IDBRequest)?.error?.message}`,
            ),
          );
        };
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBRequest<IDBDatabase>).result;
        if (!db.objectStoreNames.contains(this.objectStoreName)) {
          // Check if store exists before creating
          db.createObjectStore(this.objectStoreName);
        }
      };
    });
  }

  async setUri(id: string, uri: DataUri | null): Promise<DataUri | null> {
    assertStorageAvailable("IndexedDB", typeof indexedDB !== "undefined");
    if (uri === null) {
      return this.deleteUri(id);
    }
    return new Promise((resolve, reject) => {
      const request = indexedDB.open("localUriDB", 1);

      request.onerror = (event) => {
        reject(
          new Error(
            `IndexedDB open error: ${(event.target as IDBRequest)?.error?.message}`,
          ),
        );
      };

      request.onsuccess = (event) => {
        const db = (event.target as IDBRequest<IDBDatabase>).result;
        const transaction = db.transaction([this.objectStoreName], "readwrite");
        const store = transaction.objectStore(this.objectStoreName);
        const putRequest = store.put(uri, id);

        putRequest.onsuccess = () => {
          resolve(uri);
        };

        putRequest.onerror = (event) => {
          reject(
            new Error(
              `IndexedDB put error: ${(event.target as IDBRequest)?.error?.message}`,
            ),
          );
        };

        transaction.onerror = (event) => {
          reject(
            new Error(
              `IndexedDB transaction error: ${(event.target as IDBRequest)?.error?.message}`,
            ),
          );
        };
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBRequest<IDBDatabase>).result;
        if (!db.objectStoreNames.contains(this.objectStoreName)) {
          // Check if store exists before creating
          db.createObjectStore(this.objectStoreName);
        }
      };
    });
  }

  async deleteUri(id: string): Promise<null> {
    assertStorageAvailable("IndexedDB", typeof indexedDB !== "undefined");
    return new Promise((resolve, reject) => {
      const request = indexedDB.open("localUriDB", 1);

      request.onerror = (event) => {
        reject(
          new Error(
            `IndexedDB open error: ${(event.target as IDBRequest)?.error?.message}`,
          ),
        );
      };

      request.onsuccess = (event) => {
        const db = (event.target as IDBRequest<IDBDatabase>).result;
        const transaction = db.transaction([this.objectStoreName], "readwrite");
        const store = transaction.objectStore(this.objectStoreName);
        const deleteRequest = store.delete(id);

        deleteRequest.onsuccess = () => {
          resolve(null);
        };

        deleteRequest.onerror = (event) => {
          reject(
            new Error(
              `IndexedDB delete error: ${(event.target as IDBRequest)?.error?.message}`,
            ),
          );
        };

        transaction.onerror = (event) => {
          reject(
            new Error(
              `IndexedDB transaction error: ${(event.target as IDBRequest)?.error?.message}`,
            ),
          );
        };
      };

      request.onupgradeneeded = (event) => {
        // No need to create object store here if it doesn't exist for delete operation.
      };
    });
  }

  async getIds(): Promise<string[]> {
    assertStorageAvailable("IndexedDB", typeof indexedDB !== "undefined");
    return new Promise((resolve, reject) => {
      const request = indexedDB.open("localUriDB", 1);

      request.onerror = (event) => {
        reject(
          new Error(
            `IndexedDB error: ${(event.target as IDBRequest)?.error?.message}`,
          ),
        );
      };

      request.onsuccess = (event) => {
        const db = (event.target as IDBRequest<IDBDatabase>).result;
        const transaction = db.transaction([this.objectStoreName], "readonly");
        const store = transaction.objectStore(this.objectStoreName);
        const getKeysRequest = store.getAllKeys();

        getKeysRequest.onsuccess = (event) => {
          const allKeys = (event.target as IDBRequest<IDBValidKey[]>)
            .result as string[];
          resolve(allKeys.map(String));
        };

        getKeysRequest.onerror = (event) => {
          reject(
            new Error(
              `IndexedDB get keys error: ${(event.target as IDBRequest)?.error?.message}`,
            ),
          );
        };

        transaction.onerror = (event) => {
          reject(
            new Error(
              `IndexedDB transaction error: ${(event.target as IDBRequest)?.error?.message}`,
            ),
          );
        };
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBRequest<IDBDatabase>).result;
        if (!db.objectStoreNames.contains(this.objectStoreName)) {
          // Check if store exists before creating
          db.createObjectStore(this.objectStoreName);
        }
      };
    });
  }
}

class ExpoFileStorage implements Storage {
  private basePath: string;

  constructor(scope: string = "") {
    assertStorageAvailable("Expo FileSystem", !!FileSystem.documentDirectory);
    this.basePath = FileSystem.documentDirectory + (scope ? `${scope}/` : "");
  }

  private getFileUri(id: string): string {
    return `${this.basePath}${id}`;
  }

  async getUri(id: string): Promise<DataUri | null> {
    assertStorageAvailable("Expo FileSystem", !!FileSystem.documentDirectory);
    const fileUri = this.getFileUri(id);
    try {
      const fileInfo = await FileSystem.getInfoAsync(fileUri);
      if (!fileInfo.exists) {
        return null;
      }
      return asDataUri(fileUri);
    } catch (error: any) {
      if (error.message.includes("ENOENT")) {
        return null;
      }
      throw error;
    }
  }

  async setUri(id: string, uri: DataUri | null): Promise<DataUri | null> {
    assertStorageAvailable("Expo FileSystem", !!FileSystem.documentDirectory);
    const fileUri = this.getFileUri(id);

    if (uri === null) {
      return this.deleteUri(id);
    }
    try {
      // Ensure directory exists
      await FileSystem.makeDirectoryAsync(this.basePath, {
        intermediates: true,
      });
      await FileSystem.copyAsync({ from: uri, to: fileUri });
      return asDataUri(fileUri);
    } catch (error) {
      throw error;
    }
  }

  async deleteUri(id: string): Promise<null> {
    assertStorageAvailable("Expo FileSystem", !!FileSystem.documentDirectory);
    const fileUri = this.getFileUri(id);
    try {
      await FileSystem.deleteAsync(fileUri, { idempotent: true });
      return null;
    } catch (error) {
      throw error;
    }
  }

  async getIds(): Promise<string[]> {
    assertStorageAvailable("Expo FileSystem", !!FileSystem.documentDirectory);
    try {
      await FileSystem.makeDirectoryAsync(this.basePath, {
        intermediates: true,
      }); // Ensure dir exists to avoid error on readDirectoryAsync if dir not yet created
      const directoryContent = await FileSystem.readDirectoryAsync(
        this.basePath,
      );
      return directoryContent;
    } catch (error: any) {
      if (error.message.includes("No such directory")) {
        return [];
      }
      console.error("Error reading document directory:", error);
      return [];
    }
  }
}
