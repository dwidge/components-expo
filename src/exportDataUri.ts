import { downloadUri, viewUri } from "@dwidge/expo-export-uri";
import { asDataUri, getMimeTypeFromDataUri } from "@dwidge/file-cache-expo";

export const exportDataUri = async (
  dataUri: string,
  name = getMimeTypeFromDataUri(asDataUri(dataUri))?.replace("/", ".") ||
    "file",
  download = true,
): Promise<void> =>
  download ? downloadUri(dataUri, name) : viewUri(dataUri, name);
