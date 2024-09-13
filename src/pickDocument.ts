// Copyright DWJ 2024.
// Distributed under the Boost Software License, Version 1.0.
// https://www.boost.org/LICENSE_1_0.txt

import { Platform } from "react-native";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";
import {
  Doc,
  getBufferFromBase64,
  getDataFromUri,
  getSha256HexFromBuffer,
  getSha256HexFromUri,
} from "./uri";

const pickDocumentWeb = async () => {
  const result = await DocumentPicker.getDocumentAsync({});
  const asset = result.assets?.[0];
  if (!asset) return;

  const { uri, mimeType, size } = asset;
  // console.log("pickDocumentWeb1", asset, asset.file);

  return Doc.parse({
    data: getDataFromUri(uri),
    mime: mimeType,
    size,
    sha256: await getSha256HexFromUri(uri),
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

  const dataUri = `data:${mimeType};base64,${base64}`;

  // console.log("pickDocumentNative1", asset, dataUri.slice(0, 30));

  const buffer = await getBufferFromBase64(base64);
  const sha256 = await getSha256HexFromBuffer(buffer);
  return Doc.parse({
    data: base64,
    mime: mimeType,
    size,
    sha256,
  });
};

export const pickDocument =
  Platform.OS === "web" ? pickDocumentWeb : pickDocumentNative;
