import { asDataUri, getMimeTypeFromDataUri } from "@dwidge/file-cache-expo";
import { exportUri } from "./exportUri";

export const exportDataUri = async (dataUri: string): Promise<void> =>
  exportUri(
    dataUri,
    getMimeTypeFromDataUri(asDataUri(dataUri))?.replace("/", ".") ?? "file",
  );
