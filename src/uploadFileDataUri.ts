// Copyright DWJ 2024.
// Distributed under the Boost Software License, Version 1.0.
// https://www.boost.org/LICENSE_1_0.txt

import { ContextError } from "@dwidge/components-rnw";
import * as assert from "assert";
import Axios, { isAxiosError } from "axios";
import { Buffer } from "buffer";
import {
  getBase64FromBuffer,
  getBufferFromBase64,
  getBufferFromUri,
  getMimeFromUri,
  getSha256HexFromBuffer,
  getUriFromDoc,
} from "./uri";

export const uploadFileDataUri = async (
  putUrl: string,
  uri: string,
  size: number,
  mime: string,
  hash: string,
  getUrl: string,
  axios = Axios.create()
) =>
  (async () => {
    const putBuffer = getBufferFromUri(uri);
    assert.strictEqual(putBuffer.byteLength, size, "uploadFileDataUriE1");
    assert.strictEqual(getMimeFromUri(uri), mime, "uploadFileDataUriE2");
    assert.strictEqual(
      await getSha256HexFromBuffer(putBuffer),
      hash,
      "uploadFileDataUriE3"
    );
    await axios.put(putUrl, putBuffer, {
      headers: {
        "Content-Type": getMimeFromUri(uri),
      },
    });
    const getUri = await fetchFileDataUri(getUrl, putBuffer, axios);
    assert.ok(getUri, "uploadFileDataUriE7");
    const getBuffer = getBufferFromUri(getUri);
    assert.strictEqual(getBuffer.byteLength, size, "uploadFileDataUriE4");
    assert.strictEqual(getMimeFromUri(getUri), mime, "uploadFileDataUriE5");
    assert.strictEqual(
      await getSha256HexFromBuffer(getBuffer),
      hash,
      "uploadFileDataUriE6"
    );
  })().catch((e) => {
    throw new ContextError("uploadFileDataUriE", {
      cause: e,
      context: {
        putUrl,
        uri: uri.slice(0, 30),
        size,
        mime,
        hash,
        getUrl,
        message: e.message,
        axios: isAxiosError(e) && {
          response: e.response,
        },
      },
    });
  });

export const fetchFileDataUri = async (
  getUrl: string,
  putBuffer?: Buffer,
  axios = Axios.create()
): Promise<string | null> =>
  axios
    .get(getUrl, {
      responseType: "arraybuffer",
    })
    .then(async (response) => {
      const buffer = Buffer.from(response.data);
      if (!buffer) throw new Error("fetchFileDataUriE1", { cause: response });
      if (putBuffer) assert.ok(putBuffer.equals(buffer), "fetchFileDataUriE2");
      const mime =
        response.headers["content-type"] || "application/octet-stream";
      const data = await getBase64FromBuffer(buffer);
      assert.ok(getBufferFromBase64(data).equals(buffer), "fetchFileDataUriE3");
      return getUriFromDoc({ data, mime });
    })
    .catch((e) => {
      if (isAxiosError(e) && e.response?.status === 404) return null;
      else
        throw new ContextError("fetchFileDataUriE", {
          cause: e,
          context: {
            getUrl,
            message: e.message,
            axios: isAxiosError(e) && {
              response: e.response,
            },
          },
        });
    });
