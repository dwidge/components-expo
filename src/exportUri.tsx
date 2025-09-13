// Copyright DWJ 2024.
// Distributed under the Boost Software License, Version 1.0.
// https://www.boost.org/LICENSE_1_0.txt

import { ContextError } from "@dwidge/components-rnw";
import * as assert from "assert";
import * as FileSystem from "expo-file-system";
import * as IntentLauncher from "expo-intent-launcher";
import * as Sharing from "expo-sharing";
import { Linking, Platform } from "react-native";

const BASE_STYLE = `
  html,body{margin:0;padding:0;width:100%;height:100%;overflow:hidden;background:#fff;}
  .full{width:100%;height:100%;object-fit:contain;}
`;

const HTML_TEMPLATE = (title: string, bodyContent: string) => `
  <!doctype html>
  <html lang="en">
    <head>
      <meta charset="utf-8">
      <title>${title}</title>
      <style>${BASE_STYLE}</style>
    </head>
    <body>
      ${bodyContent}
    </body>
  </html>
`;

const MIME_REGEX = /^data:([^;]+);/;
const getMime = (dataUri: string): string => {
  const m = dataUri.match(MIME_REGEX);
  return m ? m[1] : "";
};

const makeFullScreenElement = (
  tag: "img" | "video" | "audio" | "embed",
  src: string,
  extraProps = "",
) => `<${tag} src="${src}" class="full"${extraProps}></${tag}>`;

const makeAnchor = (href: string, name: string) => `
  <a href="${href}" download="${name}" style="font-size:2rem;">
    Download ${name}
  </a>
`;

const buildImageHtml = (uri: string, name: string) =>
  HTML_TEMPLATE(name, makeFullScreenElement("img", uri));

const buildPdfHtml = (uri: string, name: string) =>
  HTML_TEMPLATE(
    name,
    makeFullScreenElement("embed", uri, ' type="application/pdf"'),
  );

const buildAudioHtml = (uri: string, name: string) =>
  HTML_TEMPLATE(
    name,
    makeFullScreenElement("audio", uri, " controls autoplay"),
  );

const buildVideoHtml = (uri: string, name: string) =>
  HTML_TEMPLATE(
    name,
    makeFullScreenElement("video", uri, " controls autoplay"),
  );

const buildFallbackHtml = (uri: string, name: string) =>
  HTML_TEMPLATE(name, makeAnchor(uri, name));

const selectBuilder = (mime: string) => {
  if (mime.startsWith("image/")) return buildImageHtml;
  if (mime === "application/pdf") return buildPdfHtml;
  if (mime.startsWith("audio/")) return buildAudioHtml;
  if (mime.startsWith("video/")) return buildVideoHtml;
  return buildFallbackHtml;
};

const downloadWeb = async (dataUri: string, name: string) => {
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
  document.body.removeChild(a);
};

const viewWeb = async (dataUri: string, name: string) => {
  const win = window.open("", "_blank");
  if (!win) throw new Error("viewWebE1: Failed to open preview window");

  const mime = getMime(dataUri);
  const htmlBuilder = selectBuilder(mime);
  const html = htmlBuilder(dataUri, name);

  win.document.open();
  win.document.write(html);
  win.document.close();

  try {
    win.focus();
  } catch (_) {}
};

const writeBase64File = async (
  dataUri: string,
  fileName: string,
): Promise<string> => {
  const tempFilePath = FileSystem.documentDirectory + fileName;
  const base64 = dataUri.split(",")[1];
  assert.ok(base64, "writeBase64FileE1: Missing base64 content");

  await FileSystem.writeAsStringAsync(tempFilePath, base64, {
    encoding: FileSystem.EncodingType.Base64,
  }).catch((cause) => {
    throw new ContextError("writeBase64FileE2: Write failed", {
      cause,
      context: { uri: dataUri.slice(0, 30), tempFilePath },
    });
  });

  return tempFilePath;
};

const downloadNative = async (dataUri: string, name: string) => {
  const tempFilePath = await writeBase64File(dataUri, name);
  await Sharing.shareAsync(tempFilePath).catch((cause) => {
    throw new ContextError("downloadNativeE1: Share failed", {
      cause,
      context: { tempFilePath },
    });
  });
};

const viewNative = async (dataUri: string, name: string) => {
  const tempFilePath = await writeBase64File(dataUri, name);
  if (Platform.OS === "android") {
    const contentUri = await FileSystem.getContentUriAsync(tempFilePath);
    const mime = getMime(dataUri);
    await IntentLauncher.startActivityAsync("android.intent.action.VIEW", {
      data: contentUri,
      flags: 1,
      type: mime,
    }).catch((cause) => {
      throw new ContextError("viewNativeE1: Open failed", {
        cause,
        context: { contentUri, tempFilePath },
      });
    });
  } else {
    const contentUri = await FileSystem.getContentUriAsync(tempFilePath);
    await Linking.openURL(contentUri).catch((cause) => {
      throw new ContextError("viewNativeE2: Open failed", {
        cause,
        context: { contentUri, tempFilePath },
      });
    });
  }
};

export const exportUri = async (
  dataUri: string,
  name: string,
  download = true,
) => {
  if (!dataUri) throw new Error("exportUriE1: No dataUri supplied");

  if (Platform.OS === "web") {
    if (download) {
      await downloadWeb(dataUri, name);
    } else {
      await viewWeb(dataUri, name);
    }
    return;
  }

  if (download) {
    await downloadNative(dataUri, name);
  } else {
    await viewNative(dataUri, name);
  }
};
