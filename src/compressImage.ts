// Copyright DWJ 2024.
// Distributed under the Boost Software License, Version 1.0.
// https://www.boost.org/LICENSE_1_0.txt

import {
  asDataUri,
  DataUri,
  getDataUriFromUri,
  getMimeTypeFromDataUri,
  MIME,
} from "@dwidge/file-cache-expo";
import { AsyncDispatch, AsyncState } from "@dwidge/hooks-react";
import * as ImageManipulator from "expo-image-manipulator";
import { useMemo } from "react";

export const isImageMimeType = (mimeType: MIME): boolean =>
  mimeType.startsWith("image/");

export const isImageDataUri = (dataUri: DataUri): boolean =>
  isImageMimeType(getMimeTypeFromDataUri(dataUri));

export const compressImage = async (
  uri: DataUri,
  resize: {
    width?: number;
    height?: number;
  } = { width: 800 },
): Promise<CompressedDataUri> => {
  const original = await ImageManipulator.manipulateAsync(uri, [], {
    compress: 1,
  });

  if (
    (resize.width && original.width > resize.width) ||
    (resize.height && original.height > resize.height)
  ) {
    return getDataUriFromUri(
      (
        await ImageManipulator.manipulateAsync(uri, [{ resize }], {
          compress: 0.7,
          format: ImageManipulator.SaveFormat.JPEG,
        })
      ).uri,
    );
  }
  return uri;
};

// Hook to automatically compress image data URIs when the URI is set.
type CompressedDataUri = DataUri;

export const useCompressImageUri = ([
  fileUri,
  setFileUri,
]: AsyncState<CompressedDataUri | null>): AsyncState<DataUri | null> => {
  const setCompressedUri: AsyncDispatch<DataUri | null> | undefined = useMemo(
    () =>
      setFileUri
        ? async (newUri) => {
            const handleSetUri = async (
              uriValue: DataUri | null | Promise<DataUri | null>,
            ) => {
              if (
                uriValue &&
                typeof uriValue === "string" &&
                isImageDataUri(asDataUri(uriValue))
              ) {
                try {
                  const compressedUri = await compressImage(uriValue);
                  return setFileUri(asDataUri(compressedUri)); // return promise from setFileUri
                } catch (error) {
                  console.warn(
                    "useCompressImageUriE1: Error compressing image, using original",
                    error,
                  );
                  return setFileUri(() => uriValue); // return promise from setFileUri, fallback to original
                }
              } else {
                return setFileUri(() => uriValue); // return promise from setFileUri
              }
            };

            if (typeof newUri === "function") {
              return setFileUri(async (prevState) => {
                // make functional update async
                const nextState = await newUri(prevState); // await the newUri function
                await handleSetUri(nextState); // await handleSetUri
                return nextState; // Return the next state for functional updates
              });
            } else {
              return handleSetUri(newUri); // return promise from handleSetUri for direct updates
            }
          }
        : undefined,
    [setFileUri],
  );

  return [fileUri, setCompressedUri];
};
