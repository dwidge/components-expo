// Copyright DWJ 2024.
// Distributed under the Boost Software License, Version 1.0.
// https://www.boost.org/LICENSE_1_0.txt

import { ContextError } from "@dwidge/components-rnw";
import * as assert from "assert";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import { Platform } from "react-native";

export async function exportUri(dataUri: string, name: string) {
  if (!dataUri) throw new Error("exportUri1");
  if (Platform.OS === "web") {
    const response = await fetch(dataUri);
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.style.display = "none";
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
  } else {
    const tempFilePath = FileSystem.documentDirectory + name;
    const base64Code = dataUri.split(",")[1];
    assert.ok(base64Code);
    await FileSystem.writeAsStringAsync(tempFilePath, base64Code, {
      encoding: FileSystem.EncodingType.Base64,
    }).catch((e) => {
      throw new ContextError("exportUri2", {
        cause: e,
        context: { uri: dataUri.slice(0, 30), tempFilePath },
      });
    });
    await Sharing.shareAsync(tempFilePath).catch((e) => {
      throw new ContextError("exportUri3", {
        cause: e,
        context: { tempFilePath },
      });
    });
  }
}
