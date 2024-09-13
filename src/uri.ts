// Copyright DWJ 2024.
// Distributed under the Boost Software License, Version 1.0.
// https://www.boost.org/LICENSE_1_0.txt

import { z } from "zod";
import * as Crypto from "expo-crypto";
import { Buffer } from "buffer";

export const getMimeFromUri = (uri: string): string =>
  uri.substring(uri.indexOf(":") + 1, uri.indexOf(";"));

export const getDataFromUri = (uri: string): string =>
  uri.substring(uri.indexOf(",") + 1);

export const getSizeFromUri = (uri: string): number =>
  getBufferFromUri(uri).byteLength;

export const getSha256HexFromUri = async (uri: string) =>
  getSha256HexFromBuffer(getBufferFromUri(uri));

export const getBufferFromUri = (uri: string) =>
  getBufferFromBase64(getDataFromUri(uri));

export const getBufferFromBase64 = (base64: string) =>
  Buffer.from(base64, "base64");

export const getSha256HexFromBuffer = async (data: Buffer) =>
  Buffer.from(
    await Crypto.digest(
      Crypto.CryptoDigestAlgorithm.SHA256,
      new Uint8Array(data)
    )
  ).toString("hex");

export const getBase64FromBuffer = async (data: Buffer) =>
  data.toString("base64");

export const getDocFromUri = async (uri: string) => {
  const mime = getMimeFromUri(uri);
  const data = getDataFromUri(uri);
  const buffer = await getBufferFromUri(uri);
  const size = buffer.byteLength;
  const sha256 = await getSha256HexFromBuffer(buffer);

  return Doc.parse({ data, mime, size, sha256 });
};

export const getUriFromDoc = (doc: Pick<Doc, "data" | "mime">) =>
  `data:${doc.mime};base64,${doc.data}`;

export const Doc = z.object({
  data: z.string().min(1),
  size: z.number().min(0),
  mime: z.string().default("application/octet-stream"),
  sha256: z.string().min(1),
});
export type Doc = z.infer<typeof Doc>;
