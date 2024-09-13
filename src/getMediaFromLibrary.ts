// Copyright DWJ 2024.
// Distributed under the Boost Software License, Version 1.0.
// https://www.boost.org/LICENSE_1_0.txt

import * as ImagePicker from "expo-image-picker";

export const getMediaFromLibrary = async () => {
  let result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.All,
    allowsMultipleSelection: true,
    aspect: [4, 3],
    quality: 1,
  });

  // console.log("takeLibrary1", result);

  return result.assets ?? [];
};

export const getMediaFromCamera = async (
  mediaTypes?: ImagePicker.MediaTypeOptions | undefined
) => {
  const { status } = await ImagePicker.requestCameraPermissionsAsync();
  if (status !== "granted") {
    // console.log("takeMedia1: Camera permissions not granted");
    return [];
  }

  let result = await ImagePicker.launchCameraAsync({
    mediaTypes,
    allowsMultipleSelection: true,
    aspect: [4, 3],
    quality: 1,
  });

  // console.log("takeMedia2", result);

  return result.assets ?? [];
};
