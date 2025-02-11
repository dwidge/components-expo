// Copyright DWJ 2024.
// Distributed under the Boost Software License, Version 1.0.
// https://www.boost.org/LICENSE_1_0.txt

import {
  ScrollView,
  StyledGrid,
  StyledIcon,
  StyledOverlay,
  StyledView,
} from "@dwidge/components-rnw";
import { ImagePickerAsset } from "expo-image-picker";
import { useState } from "react";
import { Image, Modal, Pressable, TouchableOpacity } from "react-native";
import { UnstyledMediaPicker } from "./UnstyledMediaPicker";
import { exportMedia } from "./exportMedia";

export const StyledMediaPicker = ({
  images: [images, setImages] = useState<ImagePickerAsset[]>([]),
  selectedImage: [
    selectedImage,
    setSelectedImage,
  ] = useState<ImagePickerAsset>(),
}) => (
  <>
    <UnstyledMediaPicker debug images={[images, setImages]}>
      {({ takeLibrary, takePhoto, takeVideo, dropImages, images }) => (
        <>
          <StyledView gap pad row middle>
            <StyledIcon icon="library" onPress={takeLibrary} size={36} />
            <StyledIcon icon="camera" onPress={takePhoto} size={36} />
            <StyledIcon icon="film" onPress={takeVideo} size={36} />
          </StyledView>
          <ScrollView>
            <StyledGrid gap>
              {images &&
                images.map((image) => (
                  <StyledOverlay
                    key={image.uri}
                    actions={[
                      { icon: "download", onPress: () => exportMedia(image) },
                      { icon: "trash", onPress: () => dropImages([image]) },
                    ]}
                  >
                    <TouchableOpacity
                      onPress={() => setSelectedImage(image)}
                      style={{ flex: 1 }}
                    >
                      <Image
                        source={image}
                        style={{
                          width: 150,
                          height: 150,
                        }}
                      />
                    </TouchableOpacity>
                  </StyledOverlay>
                ))}
            </StyledGrid>
          </ScrollView>
        </>
      )}
    </UnstyledMediaPicker>

    {selectedImage && (
      <Modal visible={true} transparent={true} animationType="fade">
        <Pressable
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: "rgba(0, 0, 0, 0.8)",
          }}
          onPress={() => setSelectedImage(undefined)}
        >
          <Image
            source={selectedImage}
            style={{
              width: "100%",
              height: "100%",
              resizeMode: "contain",
            }}
          />
        </Pressable>
      </Modal>
    )}
  </>
);
