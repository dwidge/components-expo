// Copyright DWJ 2024.
// Distributed under the Boost Software License, Version 1.0.
// https://www.boost.org/LICENSE_1_0.txt

import {
  asDataUri,
  asDocBin,
  getBase64FromDataUri,
  getBufferFromBase64,
  getSha256HexFromBuffer,
  getSha256HexFromDataUri,
  getSizeFromDataUri,
} from "@dwidge/file-cache-expo";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";
import { Platform } from "react-native";

const pickDocumentWeb = async () => {
  const result = await DocumentPicker.getDocumentAsync({});
  const asset = result.assets?.[0];
  if (!asset) return;

  const { uri, mimeType, size } = asset;
  // console.log("pickDocumentWeb1", asset, asset.file);

  const dataUri = asDataUri(uri);

  return asDocBin({
    data: getBase64FromDataUri(dataUri),
    mime: mimeType ?? "application/octet-stream",
    size: size ?? getSizeFromDataUri(dataUri),
    sha256: await getSha256HexFromDataUri(dataUri),
  });
};

const pickDocumentNative = async () => {
  const result = await DocumentPicker.getDocumentAsync({});
  const asset = result.assets?.[0];
  if (!asset) return;

  const { uri, mimeType, size } = asset;

  const base64 = await FileSystem.readAsStringAsync(uri, {
    encoding: FileSystem.EncodingType.Base64,
  });

  // const dataUri = asDataUri(`data:${mimeType};base64,${base64}`);
  const dataUri = asDataUri(uri);

  // console.log("pickDocumentNative1", asset, dataUri.slice(0, 30));

  const buffer = await getBufferFromBase64(base64);
  const sha256 = await getSha256HexFromBuffer(buffer);
  return asDocBin({
    data: base64,
    mime: mimeType ?? "application/octet-stream",
    size: size ?? getSizeFromDataUri(dataUri),
    sha256,
  });
};

export const pickDocument =
  Platform.OS === "web" ? pickDocumentWeb : pickDocumentNative;
