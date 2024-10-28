// Copyright DWJ 2024.
// Distributed under the Boost Software License, Version 1.0.
// https://www.boost.org/LICENSE_1_0.txt

import { Modal, TouchableOpacity, View, Text, Button } from "react-native";
import { StyledView } from "@dwidge/components-rnw";
import { FilePreview } from "./FilePreview";
import { useState } from "react";

export const FilePreviewModal = ({
  visible: [isModalVisible, setModalVisible] = useState(false),
  dataUri = undefined as string | null | undefined,
}) => {
  const [zoomLevel, setZoomLevel] = useState(1);

  const increaseZoom = () => {
    setZoomLevel((prevZoom) => prevZoom + 0.1);
  };

  const decreaseZoom = () => {
    setZoomLevel((prevZoom) => Math.max(prevZoom - 0.1, 0.5)); // Prevent zooming out too much
  };

  return (
    <Modal
      visible={isModalVisible}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setModalVisible(false)}
    >
      <StyledView style={{ flex: 1, backgroundColor: "rgba(0, 0, 0, 0.8)" }}>
        <TouchableOpacity
          style={{ flex: 1 }}
          onPress={() => setModalVisible(false)}
        >
          <View style={{ flex: 1 }}>
            <StyledView style={{ flex: 1, transform: [{ scale: zoomLevel }] }}>
              <FilePreview dataUri={dataUri} />
            </StyledView>
            <View style={{ flexDirection: "row" }}>
              <Button title="Zoom In" onPress={increaseZoom} />
              <Button title="Zoom Out" onPress={decreaseZoom} />
            </View>
          </View>
        </TouchableOpacity>
      </StyledView>
    </Modal>
  );
};
