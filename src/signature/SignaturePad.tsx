// Copyright DWJ 2024.
// Distributed under the Boost Software License, Version 1.0.
// https://www.boost.org/LICENSE_1_0.txt

import { StyledText } from "@dwidge/components-rnw";
import { useOptionalState } from "@dwidge/hooks-react";
import { WebView } from "@dwidge/react-native-web-webview";
import { useRef, useState } from "react";
import { Button, Image, Modal, TouchableOpacity, View } from "react-native";

export const SignaturePad = ({
  dataUri: [dataUri, setDataUri] = useOptionalState<string | null>(null),
  height = 100,
  width = 300,
}) => {
  const webViewRef = useRef<WebView>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body, html {
          margin: 0; padding: 10; overflow: hidden;
          display: flex; align-items: center; justify-content: center;
          height: 100%;
          background-color: #fff;
        }
        #padCanvas {
          border: 1px solid #000;
          touch-action: none;
          margin: auto;
        }
      </style>
    </head>
    <body>
      <canvas id="padCanvas" width="${width}" height="${height}"></canvas>
      
      <script>
        const canvas = document.getElementById('padCanvas');
        const ctx = canvas.getContext('2d');

        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.strokeStyle = '#000';

        let drawing = false;

        function startDrawing(e) {
          drawing = true;
          ctx.beginPath();
          const rect = canvas.getBoundingClientRect();
          const clientX = e.touches ? e.touches[0].clientX : e.clientX;
          const clientY = e.touches ? e.touches[0].clientY : e.clientY;
          ctx.moveTo((clientX - rect.left), (clientY - rect.top));
        }

        function draw(e) {
          if (!drawing) return;
          const rect = canvas.getBoundingClientRect();
          const clientX = e.touches ? e.touches[0].clientX : e.clientX;
          const clientY = e.touches ? e.touches[0].clientY : e.clientY;
          ctx.lineTo((clientX - rect.left), (clientY - rect.top));
          ctx.stroke();
        }

        function endDrawing() {
          drawing = false;
        }

        canvas.addEventListener('touchstart', startDrawing);
        canvas.addEventListener('touchmove', draw);
        canvas.addEventListener('touchend', endDrawing);
        canvas.addEventListener('mousedown', startDrawing);
        canvas.addEventListener('mousemove', draw);
        canvas.addEventListener('mouseup', endDrawing);
        canvas.addEventListener('mouseleave', endDrawing); // To handle mouse leaving the canvas

        function clearCanvas() {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
        }

        function saveCanvas() {
          const dataUrl = canvas.toDataURL('image/png');
          window.ReactNativeWebView.postMessage(JSON.stringify({ source: 'canvas', payload: dataUrl }));
        }

        // Load the existing image if available
        const uri = '${dataUri || ""}';
        if (uri) {
          const img = new Image();
          img.onload = () => {
            clearCanvas();
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          };
          img.src = uri;
        }
      </script>
    </body>
    </html>
  `;

  const onMessage = (event: { nativeEvent: { data: string } }) => {
    const message = event.nativeEvent.data;
    const { source, payload } =
      typeof message === "string" ? JSON.parse(message) : message;
    if (source === "canvas" && setDataUri) {
      if (typeof payload !== "string")
        throw new Error("SignaturePadE1: payload not a string");
      setDataUri(payload);
      setModalVisible(false);
    }
  };

  const cancelCanvas = () => {
    setModalVisible(false);
  };
  const saveCanvas = () => {
    webViewRef.current?.injectJavaScript(`saveCanvas();`);
  };
  const clearCanvas = () => {
    webViewRef.current?.injectJavaScript(`clearCanvas();`);
  };

  return (
    <View style={{ flex: 1 }}>
      <TouchableOpacity onPress={() => setModalVisible(true)}>
        {dataUri ? (
          <View style={{ height }}>
            <Image
              source={{ uri: dataUri }}
              style={{ flex: 1, backgroundColor: "#ccc" }}
              resizeMode="contain"
            />
          </View>
        ) : setDataUri ? (
          <StyledText outline pad center>
            Tap to add signature
          </StyledText>
        ) : (
          <StyledText outline pad center>
            No signature
          </StyledText>
        )}
      </TouchableOpacity>
      <Modal visible={modalVisible} animationType="slide">
        <View style={{ flex: 1, height: height, padding: 10 }}>
          <WebView
            ref={webViewRef}
            originWhitelist={["*"]}
            source={{ html: htmlContent }}
            javaScriptEnabled
            onMessage={onMessage}
            style={{ flex: 1 }}
          />
          <View style={{ flexDirection: "row", gap: 10 }}>
            <View style={{ flex: 1 }}>
              <Button title="Cancel" onPress={cancelCanvas} />
            </View>
            <View style={{ flex: 1 }}>
              <Button title="Clear" onPress={clearCanvas} />
            </View>
            <View style={{ flex: 1 }}>
              <Button title="Save" onPress={saveCanvas} />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};