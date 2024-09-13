// Copyright DWJ 2024.
// Distributed under the Boost Software License, Version 1.0.
// https://www.boost.org/LICENSE_1_0.txt

import * as ImageManipulator from "expo-image-manipulator";

export const compressImage = async (
  uri: string,
  resize: {
    width?: number;
    height?: number;
  } = { width: 800 }
) => {
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
