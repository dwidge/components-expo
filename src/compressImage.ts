// Copyright DWJ 2024.
// Distributed under the Boost Software License, Version 1.0.
// https://www.boost.org/LICENSE_1_0.txt

import { AsyncDispatch, AsyncState } from "@dwidge/hooks-react";
import * as ImageManipulator from "expo-image-manipulator";
import { useMemo } from "react";
import { asDataUri, isImageDataUri } from "./uri.js";

export const compressImage = async (
  uri: string,
  resize: {
    width?: number;
    height?: number;
  } = { width: 800 },
): Promise<string> => {
  const original = await ImageManipulator.manipulateAsync(uri, [], {
    compress: 1,
  });

  if (
    (resize.width && original.width > resize.width) ||
    (resize.height && original.height > resize.height)
  ) {
    return (
      await ImageManipulator.manipulateAsync(uri, [{ resize }], {
        compress: 0.7,
        format: ImageManipulator.SaveFormat.JPEG,
      })
    ).uri;
  }
  return uri;
};

// Hook to automatically compress image data URIs when the URI is set.
type CompressedDataUri = string | null;
type DataUri = string | null;
export const useCompressImageUri = ([
  fileUri,
  setFileUri,
]: AsyncState<CompressedDataUri>): AsyncState<DataUri> => {
  const setCompressedUri: AsyncDispatch<DataUri> | undefined = useMemo(
    () =>
      setFileUri
        ? async (newUri) => {
            const handleSetUri = async (
              uriValue: DataUri | Promise<DataUri>,
            ) => {
              if (
                uriValue &&
                typeof uriValue === "string" &&
                isImageDataUri(asDataUri(uriValue))
              ) {
                try {
                  const compressedUri = await compressImage(uriValue);
                  return setFileUri(() => compressedUri); // return promise from setFileUri
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
