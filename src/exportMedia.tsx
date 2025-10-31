// Copyright DWJ 2024.
// Distributed under the Boost Software License, Version 1.0.
// https://www.boost.org/LICENSE_1_0.txt

import { downloadUri } from "@dwidge/expo-export-uri";
import * as ImagePicker from "expo-image-picker";

export const exportMedia = (media: ImagePicker.ImagePickerAsset) =>
  downloadUri(
    media.uri,
    media.mimeType?.replace("/", ".") ?? media.type ?? "file",
  );
