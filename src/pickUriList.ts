import * as DocumentPicker from "expo-document-picker";
import { getMediaFromLibrary } from "./getMediaFromLibrary";

export const pickMediaUriList = async (): Promise<string[]> => {
  const result = await getMediaFromLibrary();
  return result.map((asset) => asset.uri);
};

export const pickDocUriList = async (): Promise<string[]> => {
  const result = await DocumentPicker.getDocumentAsync({});
  return result.assets?.map((a) => a.uri) ?? [];
};
