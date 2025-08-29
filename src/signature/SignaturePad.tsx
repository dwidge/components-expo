// Copyright DWJ 2024.
// Distributed under the Boost Software License, Version 1.0.
// https://www.boost.org/LICENSE_1_0.txt

import { StyledText } from "@dwidge/components-rnw";
import { asDataUri, DataUri } from "@dwidge/file-cache-expo";
import { AsyncState, OptionalState, useAsyncState } from "@dwidge/hooks-react";
import { WebView } from "@dwidge/react-native-web-webview";
import { useRef, useState } from "react";
import { Button, Image, Modal, View } from "react-native";
import { OptionalTouchable } from "./OptionalTouchable";

/**
 * Interface for the SignaturePad component props.
 */
interface SignaturePadProps {
  /**
   * An optional state tuple to manage the signature data URI.
   *
   * - The first element is the current data URI (string or null).
   * - The second element is the setter function for the data URI.
   *
   * If current is not provided (undefined), the component will be disabled/uninitialized.
   * If setter is not provided (undefined), the component will be read-only, non editable.
   */
  dataUri?: AsyncState<DataUri | null> | OptionalState<DataUri | null>;
  /**
   * The height of the signature pad canvas and preview area.
   * @default 100
   */
  height?: number;
  /**
   * The width of the signature pad canvas.
   * @default 300
   */
  width?: number;
}

/**
 * SignaturePad Component for capturing signatures using a WebView canvas.
 *
 * This component renders a signature pad using an HTML canvas within a WebView.
 * It allows users to draw signatures and save them as data URIs.
 *
 * @param {SignaturePadProps} props - The component props.
 * @returns {React.JSX.Element} The SignaturePad component.
 *
 * @example
 * // Usage with state management:
 * const [signatureData, setSignatureData] = useAsyncState<string | null>(null);
 * <SignaturePad dataUri={[signatureData, setSignatureData]} />
 *
 * @example
 * // Usage as display only:
 * <SignaturePad dataUri={[null, undefined]} />
 *
 * @example
 * // Usage with initial data:
 * const [signatureData, setSignatureData] = useAsyncState<string | null>("data:image/png;base64,...");
 * <SignaturePad dataUri={[signatureData, setSignatureData]} />
 */
export const SignaturePad = ({
  dataUri: [dataUri, setDataUri] = useAsyncState<DataUri | null>(null),
  height = 100,
  width = 300,
}: SignaturePadProps) => {
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
      setDataUri(asDataUri(payload));
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
      <OptionalTouchable
        onPress={setDataUri ? () => setModalVisible(true) : undefined}
      >
        {dataUri ? (
          <SigImage dataUri={dataUri} height={height} />
        ) : (
          <NoSigImage setDataUri={setDataUri} />
        )}
      </OptionalTouchable>
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

const SigImage = ({
  dataUri,
  height,
}: {
  dataUri: DataUri;
  height: number;
}) => (
  <View style={{ height }}>
    <Image
      source={{ uri: dataUri }}
      style={{ flex: 1, backgroundColor: "#ccc" }}
      resizeMode="contain"
    />
  </View>
);

const NoSigImage = ({
  setDataUri,
}: {
  setDataUri?: (v: DataUri | null) => unknown;
}) => (
  <StyledText outline pad center>
    No signature {setDataUri ? "(Tap to add)" : ""}
  </StyledText>
);
