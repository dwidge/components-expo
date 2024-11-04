// Copyright DWJ 2024.
// Distributed under the Boost Software License, Version 1.0.
// https://www.boost.org/LICENSE_1_0.txt

import { useEffect, useState } from "react";
import { compressImage } from "../compressImage.js";
import { getDocFromUri, getMimeFromUri, getSizeFromUri } from "../uri.js";
import { useAxios } from "../useAxios.js";
import { UseFile2 } from "./FileType.js";
import { fetchFileDataUri, uploadFileDataUri } from "./uploadFileDataUri.js";

export const useFileUri = (
  [file, setFile]: UseFile2,
  axios = useAxios(),
): [
  (null | string)?,
  ((uri: null | string, mime: string) => Promise<void>)?,
  boolean?,
] => {
  const [localMeta, setLocalMeta] = useState<
    | {
        id?: string | undefined;
        size?: number | null | undefined;
        mime?: string | null | undefined;
        sha256?: string | null | undefined;
        uri?: string | null | undefined;
      }
    | null
    | undefined
  >();
  const [uploaded, setUploaded] = useState(true);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (localMeta?.uri && file && !uploaded && !isUploading) {
      const { putUrl, getUrl, mime, size, sha256 } = file;
      if (
        putUrl != null &&
        mime != null &&
        size != null &&
        sha256 != null &&
        getUrl != null &&
        mime === getMimeFromUri(localMeta?.uri) &&
        size === getSizeFromUri(localMeta?.uri)
      ) {
        setIsUploading(true);
        uploadFileDataUri(
          putUrl,
          localMeta?.uri,
          size,
          mime,
          sha256,
          getUrl,
          axios,
        ).then(() => {
          setUploaded(true);
          setIsUploading(false);
        });
      }
    }
    if (localMeta?.uri === undefined && file && uploaded) {
      const { getUrl, mime } = file;
      if (getUrl != null && mime != null) {
        fetchFileDataUri(getUrl, undefined, axios).then((uri) => {
          setLocalMeta({ ...file, uri });
          setUploaded(!!uri);
        });
      } else {
        setLocalMeta(null);
        setUploaded(false);
      }
    }
  }, [localMeta, file, uploaded, isUploading]);

  const setUri =
    file && setFile
      ? async (uri: null | string, mime: string) => {
          if (uri == null) {
            setLocalMeta(null);
            setUploaded(true);
            setIsUploading(false);
            setFile({ id: file.id, mime: null, sha256: null, size: null });
          } else {
            const isImage = mime.startsWith("image/");
            const compressedUri = isImage ? await compressImage(uri) : uri;
            const dataUri = await convertFilePathToDataUri(compressedUri);
            const doc = await getDocFromUri(dataUri);
            setLocalMeta({
              id: file.id,
              mime: mime,
              sha256: doc.sha256,
              size: doc.size,
              uri: dataUri,
            });
            setUploaded(false);
            setIsUploading(false);
            setFile({
              id: file.id,
              mime: mime,
              sha256: doc.sha256,
              size: doc.size,
            });
          }
        }
      : undefined;

  return [
    file?.getUrl === null ? null : localMeta?.uri,
    setUri,
    isUploading || (!uploaded && !!localMeta?.uri),
  ];
};

const convertFilePathToDataUri = async (filePath: string) => {
  if (!filePath.startsWith("file:")) return filePath;
  const response = await fetch(filePath);
  const blob = await response.blob();
  const reader = new FileReader();
  return new Promise<string>((resolve) => {
    reader.onloadend = () => {
      resolve(reader.result as string);
    };
    reader.readAsDataURL(blob);
  });
};
