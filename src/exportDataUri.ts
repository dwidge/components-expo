import { asDataUri, getMimeTypeFromDataUri } from "@dwidge/file-cache-expo";
import { exportUri } from "./exportUri";

export const exportDataUri = async (
  dataUri: string,
  name = getMimeTypeFromDataUri(asDataUri(dataUri))?.replace("/", ".") ??
    "file",
  download = true,
): Promise<void> => exportUri(dataUri, name, download);
