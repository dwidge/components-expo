// Copyright DWJ 2024.
// Distributed under the Boost Software License, Version 1.0.
// https://www.boost.org/LICENSE_1_0.txt

import * as ImagePicker from "expo-image-picker";
import { exportUri } from "./exportUri";

export const exportMedia = (media: ImagePicker.ImagePickerAsset) =>
  exportUri(
    media.uri,
    media.mimeType?.replace("/", ".") ?? media.type ?? "file"
  );
