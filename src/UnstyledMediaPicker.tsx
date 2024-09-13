// Copyright DWJ 2024.
// Distributed under the Boost Software License, Version 1.0.
// https://www.boost.org/LICENSE_1_0.txt

import { ReactNode, useState } from "react";
import * as ImagePicker from "expo-image-picker";
import { getMediaFromCamera, getMediaFromLibrary } from "./getMediaFromLibrary";

export const UnstyledMediaPicker = ({
  images: [images, setImages] = useState<ImagePicker.ImagePickerAsset[]>([]),
  children,
  debug,
}: {
  images?: [
    ImagePicker.ImagePickerAsset[],
    (images: ImagePicker.ImagePickerAsset[]) => unknown,
  ];
  children?: (props: {
    takeLibrary: () => unknown;
    takePhoto: () => unknown;
    takeVideo: () => unknown;
    takeMedia: () => unknown;
    addImages: (add: ImagePicker.ImagePickerAsset[]) => unknown;
    dropImages: (drop: ImagePicker.ImagePickerAsset[]) => unknown;
    setImages: (drop: ImagePicker.ImagePickerAsset[]) => unknown;
    images: ImagePicker.ImagePickerAsset[];
  }) => ReactNode;
  debug?: boolean;
}) => {
  const addImages = (add: ImagePicker.ImagePickerAsset[]) => {
    setImages(images.concat(add));
  };

  const dropImages = (drop: ImagePicker.ImagePickerAsset[]) => {
    setImages(images.filter((v) => !drop.includes(v)));
  };

  return children?.({
    takeLibrary: () => getMediaFromLibrary().then(addImages),
    takePhoto: () =>
      getMediaFromCamera(ImagePicker.MediaTypeOptions.Images).then(addImages),
    takeVideo: () =>
      getMediaFromCamera(ImagePicker.MediaTypeOptions.Videos).then(addImages),
    takeMedia: (mediaTypes?: ImagePicker.MediaTypeOptions | undefined) =>
      getMediaFromCamera(mediaTypes).then(addImages),
    addImages,
    dropImages,
    setImages,
    images,
  });
};
