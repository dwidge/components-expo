import { StyledButton, StyledView } from "@dwidge/components-rnw";
import { asDataUri, DataUri } from "@dwidge/file-cache-expo";
import { AsyncState, OptionalState, useAsyncState } from "@dwidge/hooks-react";
import { WebView } from "@dwidge/react-native-web-webview";
import { Fragment, useCallback, useEffect, useRef, useState } from "react";
import { Modal, StyleProp, TouchableOpacity, ViewStyle } from "react-native";
import { CompositeImage } from "./CompositeImage.js";

/**
 * Properties for the {@link DoodlePad} component.
 *
 * Defines the configuration options for customizing the doodle pad's behavior and appearance.
 */
interface DoodlePadProps {
  /**
   * A state tuple to manage the doodle data URI, representing the drawn image.
   *
   * This prop accepts either an {@link AsyncState} or {@link OptionalState} tuple.
   *
   * - **First element:** The current doodle data URI (string or null). Represents the current state of the doodle.
   * - **Second element:** The setter function for the data URI. Used to update the doodle state, triggering re-renders.
   *
   * If `doodleUri` is not provided (undefined), the component will be effectively disabled or uninitialized,
   * not rendering any interactive doodle functionality.
   *
   * If only the first element (getter) is provided, the component will be read-only and non-editable,
   * displaying the doodle but preventing modifications.
   *
   * @example // Using AsyncState for doodle URI management
   * const [doodleUri, setDoodleUri] = useAsyncState<DataUri | null>(null);
   * <DoodlePad doodleUri={[doodleUri, setDoodleUri]} />;
   *
   * @example // Using OptionalState for doodle URI management (initial value can be undefined)
   * const [doodleUri, setDoodleUri] = useState<DataUri | null>(null);
   * <DoodlePad doodleUri={[doodleUri, setDoodleUri]} />;
   *
   * @example // Read-only DoodlePad, displaying a doodle but not allowing edits
   * <DoodlePad doodleUri={[doodleUri]} />; // Assuming doodleUri is defined elsewhere
   */
  doodleUri?: AsyncState<DataUri | null> | OptionalState<DataUri | null>;
  /**
   * The drawing resolution width, defining the horizontal pixel dimension of the doodle canvas.
   *
   * If provided, this width is used directly for the canvas.
   * If not provided but a `backgroundUri` is given, the canvas width is derived from the background image's width,
   * potentially adjusted based on the `height` prop to maintain aspect ratio.
   * If neither `width`, `height`, nor `backgroundUri` are provided, the canvas defaults to the viewport width.
   *
   * @example // Setting a specific canvas width
   * <DoodlePad width={500} />;
   */
  width?: number;
  /**
   * The drawing resolution height, defining the vertical pixel dimension of the doodle canvas.
   *
   * If provided, this height is used directly for the canvas.
   * If not provided but a `backgroundUri` is given, the canvas height is derived from the background image's height,
   * potentially adjusted based on the `width` prop to maintain aspect ratio.
   * If neither `width`, `height`, nor `backgroundUri` are provided, the canvas defaults to the viewport height.
   *
   * @example // Setting a specific canvas height
   * <DoodlePad height={400} />;
   */
  height?: number;
  /**
   * Optional background image DataUri to display behind the drawing canvas.
   *
   * This image serves as a non-editable backdrop for the doodle, providing context or a drawing template.
   *
   * When a `backgroundUri` is provided, the DoodlePad intelligently attempts to match the doodle canvas's aspect ratio
   * to the image's aspect ratio, ensuring a seamless overlay.
   * If both `width` and `height` props are also specified, they take precedence, and the background image will be scaled
   * to fit within the defined doodle dimensions.
   *
   * If the `backgroundUri` changes, the background image will be updated and resized to fit within the doodle canvas,
   * even if the aspect ratio differs from the previous background or doodle.
   * Clearing the doodle will trigger recalculation of the doodle canvas dimensions based on the background.
   *
   * The doodle canvas will always be sized to fully cover or match the background image area, preventing any uncovered background regions.
   * Conversely, the background image will always be fully contained within the bounds of the doodle canvas.
   *
   * @example // Setting a background image from a DataUri
   * <DoodlePad backgroundUri={myBackgroundImageDataUri} />;
   */
  backgroundUri?: DataUri | null;
  /**
   * Optional background color for the drawing area, visible when no background image is provided.
   *
   * This color fills the canvas area behind the doodle strokes, providing a solid base color.
   * It is primarily useful when a `backgroundUri` is not used.
   *
   * @example // Setting a background color
   * <DoodlePad backgroundColor="lightgray" />;
   */
  backgroundColor?: string;
  /**
   * Style properties to apply to the preview area, encompassing the TouchableOpacity and CompositeImage.
   *
   * Use this prop to customize the visual appearance and layout of the doodle preview displayed
   * before opening the editor modal. This style affects the container of the preview image.
   *
   * @example // Styling the preview area with a border and margin
   * <DoodlePad style={{ borderWidth: 1, borderColor: 'black', margin: 10 }} />;
   */
  style?: StyleProp<ViewStyle>;
  /**
   * Determines whether the editor modal should display in full-screen mode or centered at 1:1 resolution.
   *
   * - `true` (default): The editor modal expands to full screen, scaling the background image and canvas to fit
   *   the device screen while maintaining their aspect ratio. This is ideal for immersive editing experiences.
   * - `false`: The editor modal is centered on the screen, displaying the doodle and background at their actual resolution (1:1),
   *   potentially scaled down if they exceed the screen dimensions. This mode is useful for precise pixel-level editing
   *   or when the original resolution is important.
   *
   * @default true
   * @example // Disabling maximize mode for a 1:1 resolution editor
   * <DoodlePad maximize={false} />;
   */
  maximize?: boolean;

  log?: (...args: any[]) => void;
}

/**
 * Array of colors available in the doodle pad palette.
 *
 * This array defines the default color options presented to the user within the doodle editor.
 * Users can select colors from this palette to draw on the canvas.
 */
const colorPalette = [
  "white",
  "gray",
  "black",
  "red",
  "green",
  "blue",
  "yellow",
  "orange",
  "purple",
  "cyan",
  "magenta",
  "brown",
];

/**
 * HTML content for the DoodlePad WebView.
 *
 * This string contains the complete HTML structure, including CSS styles and JavaScript logic,
 * that powers the interactive doodle canvas within the WebView. It sets up the canvas,
 * handles drawing events, manages color selection, and provides communication bridges
 * with the React Native component.
 *
 * @private
 */
const doodlePadHTML = `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
      body, html {
        margin: 0; padding: 0; height: 100%; overflow: hidden;
      }
      #container {
        position: relative;
        width: 100%;
        height: 100%;
        border: solid 2px grey;
        box-sizing: border-box;
        overflow: hidden;
      }
      #bgImage {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        max-width: 100%;
        max-height: 100%;
        object-fit: contain;
        transform-origin: top left;
      }
      #padCanvas {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        max-width: 100%;
        max-height: 100%;
        object-fit: contain;
        touch-action: none;
        background-color: transparent;
        transform-origin: top left;
        border: solid 1px grey;
      }
      #palette {
        position: absolute;
        top: 10px;
        left: 10px;
        padding: 3px;
        display: flex;
        flex-direction: column;
        gap: 3px;
        z-index: 2;
      }
      .color-swatch {
        width: 25px;
        height: 25px;
        border: 3px solid transparent;
        cursor: pointer;
      }
      .color-swatch.selected {
        border: 3px solid white;
      }
      #shape-palette {
        position: absolute;
        top: 10px;
        right: 10px;
        padding: 3px;
        display: flex;
        flex-direction: column;
        gap: 3px;
        z-index: 2;
      }
      .shape-button {
        width: 30px;
        height: 30px;
        background-color: #eee;
        border: 1px solid #ccc;
        border-radius: 5px;
        display: flex;
        justify-content: center;
        align-items: center;
        cursor: pointer;
      }
      .shape-button.selected {
        background-color: #aaa;
      }
    </style>
  </head>
  <body>
    <div id="container">
      <canvas id="padCanvas"></canvas>
      <div id="palette" style="display:none;"></div>
      <div id="shape-palette" style="display:none;">
        <div class="shape-button selected" data-shape="pencil" id="pencil-button">✏️</div>
        <div class="shape-button" data-shape="circle" id="circle-button">⚪</div>
        <div class="shape-button" data-shape="square" id="square-button">⬜</div>
      </div>
    </div>
    <script>
      const container = document.getElementById('container');
      const canvas = document.getElementById('padCanvas');
      const ctx = canvas.getContext('2d');
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      let drawing = false;
      let history = [];
      let currentPath = [];
      let currentColor = 'white';
      ctx.strokeStyle = currentColor;
      let bgImage = null;
      let canvasResWidth = null;
      let canvasResHeight = null;
      let selectedSwatch = null;
      let doodleImage = null;
      let drawingMode = 'pencil'; // pencil, circle, square
      let shapeStartPoint = null;
      let shapeEndPoint = null;
      let currentShape = null;
      let selectedShapeButton = null;

      // Zoom and Pan Variables
      let zoom = 1;           // Initial zoom level (1x)
      let panX = 0;           // Horizontal pan offset in pixels
      let panY = 0;           // Vertical pan offset in pixels
      let isPanning = false;  // Flag to track panning state
      let startPanX = 0;      // Starting panX for drag
      let startPanY = 0;      // Starting panY for drag
      let startMouseX = 0;    // Starting mouse X for drag
      let startMouseY = 0;    // Starting mouse Y for drag
      let initialDistance = null; // Initial distance for pinch zoom
      let initialZoom = null;     // Initial zoom for pinch zoom

      /**
       * Logs messages to the React Native WebView.
       * @param {...any} args - Arguments to log.
       */
      function log(...args) {
        window.ReactNativeWebView.postMessage(JSON.stringify({ source: 'webview-log', payload: args }));
      }

      /**
       * Sets the current drawing color and updates the selected swatch.
       * @param {string} color - The color to set (e.g., 'red', '#FF0000').
       */
      function setColor(color) {
        currentColor = color;
        ctx.strokeStyle = currentColor;
        if (selectedSwatch) selectedSwatch.classList.remove('selected');
        selectedSwatch = document.querySelector(\`.color-swatch[data-color="\${color}"]\`);
        if (selectedSwatch) selectedSwatch.classList.add('selected');
      }

      /**
       * Sets the current drawing shape and updates the selected shape button.
       * @param {string} shape - The shape to set ('pencil', 'circle', 'square').
       */
      function setDrawingShape(shape) {
        drawingMode = shape;
        if (selectedShapeButton) selectedShapeButton.classList.remove('selected');
        selectedShapeButton = document.getElementById(\`\${shape}-button\`);
        if (selectedShapeButton) selectedShapeButton.classList.add('selected');
      }

      /**
       * Applies zoom and pan transformations to both the background image and canvas.
       */
      function applyTransform() {
        clampPan();
        const transform = \`translate(\${panX}px, \${panY}px) scale(\${zoom})\`;
        if (bgImage) bgImage.style.transform = transform;
        canvas.style.transform = transform;
      }

      /**
       * Clamps pan values to limit panning to 50% out of bounds.
       */
      function clampPan() {
        const containerRect = container.getBoundingClientRect();
        const containerWidth = containerRect.width;
        const containerHeight = containerRect.height;
        const canvasRect = canvas.getBoundingClientRect();
        const fitWidth = canvasRect.width / zoom;
        const fitHeight = canvasRect.height / zoom;
        const minPanX = -0.5 * fitWidth * zoom;
        const maxPanX = containerWidth - 0.5 * fitWidth * zoom;
        const minPanY = -0.5 * fitHeight * zoom;
        const maxPanY = containerHeight - 0.5 * fitHeight * zoom;
        panX = Math.max(minPanX, Math.min(maxPanX, panX));
        panY = Math.max(minPanY, Math.min(maxPanY, panY));
      }

      /**
       * Converts screen coordinates to canvas coordinates, accounting for zoom and pan.
       * @param {number} clientX - The x-coordinate of the mouse or touch event.
       * @param {number} clientY - The y-coordinate of the mouse or touch event.
       * @returns {{x: number, y: number}} - The coordinates relative to the canvas.
       */
      function getCanvasRelativeCoords(clientX, clientY) {
        const rect = canvas.getBoundingClientRect();
        const canvasWidth = canvas.width; // Internal canvas width (resolution)
        const canvasHeight = canvas.height; // Internal canvas height (resolution)
        const rectWidth = rect.width;       // Rendered width in the browser
        const rectHeight = rect.height;     // Rendered height in the browser

        let scaleX = canvasWidth / rectWidth;  // Initial scale factors (may need adjustment)
        let scaleY = canvasHeight / rectHeight;

        let offsetX = 0; // Offset in X direction if canvas is centered horizontally
        let offsetY = 0; // Offset in Y direction if canvas is centered vertically

        // Determine scaling and offsets based on aspect ratio and object-fit: contain
        const canvasAspectRatio = canvasWidth / canvasHeight;
        const rectAspectRatio = rectWidth / rectHeight;

        if (canvasAspectRatio > rectAspectRatio) {
          // Canvas is wider than the container - vertical padding
          scaleY = scaleX; // Scale based on width to fit horizontally
          const scaledCanvasHeight = canvasHeight * (rectWidth / canvasWidth); // Height after width-based scaling
          offsetY = (rectHeight - scaledCanvasHeight) / 2; // Calculate vertical offset
        } else if (canvasAspectRatio < rectAspectRatio) {
          // Canvas is taller than the container - horizontal padding
          scaleX = scaleY; // Scale based on height to fit vertically
          const scaledCanvasWidth = canvasWidth * (rectHeight / canvasHeight); // Width after height-based scaling
          offsetX = (rectWidth - scaledCanvasWidth) / 2;     // Calculate horizontal offset
        }

        return {
          x: (clientX - rect.left - offsetX) * scaleX,
          y: (clientY - rect.top - offsetY) * scaleY
        };
      }

      /**
       * Starts drawing or panning based on the mouse button pressed.
       * @param {MouseEvent} e - The mouse event.
       */
      function startDrawing(e) {
        e.preventDefault(); // Prevent selection
        if (e.type === 'mousedown') {
          if (e.button === 0) { // Left-click for drawing
            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            if (x >= 0 && x < rect.width && y >= 0 && y < rect.height) {
              drawing = true;
              const canvasCoords = getCanvasRelativeCoords(e.clientX, e.clientY);
              if (drawingMode === 'pencil') {
                ctx.beginPath();
                ctx.strokeStyle = currentColor;
                ctx.lineWidth = 2;
                ctx.lineCap = 'round';
                ctx.moveTo(canvasCoords.x, canvasCoords.y);
                currentPath = [{ x: canvasCoords.x, y: canvasCoords.y, start: true, color: currentColor }];
              } else if (drawingMode === 'circle' || drawingMode === 'square') {
                shapeStartPoint = canvasCoords;
                shapeEndPoint = canvasCoords;
                currentShape = { shape: drawingMode, start: shapeStartPoint, end: shapeEndPoint, color: currentColor };
              }
            }
          } else if (e.button === 2) { // Right-click for panning
            isPanning = true;
            startPanX = panX;
            startPanY = panY;
            startMouseX = e.clientX;
            startMouseY = e.clientY;
          }
        }
      }

      /**
       * Handles drawing or panning while the mouse moves.
       * @param {MouseEvent} e - The mouse event.
       */
      function draw(e) {
        e.preventDefault(); // Prevent selection
        if (drawing) {
          const canvasCoords = getCanvasRelativeCoords(e.clientX, e.clientY);
          if (drawingMode === 'pencil') {
            ctx.lineTo(canvasCoords.x, canvasCoords.y);
            ctx.stroke();
            currentPath.push({ x: canvasCoords.x, y: canvasCoords.y, color: currentColor });
          } else if (drawingMode === 'circle' || drawingMode === 'square') {
            shapeEndPoint = canvasCoords;
            currentShape.end = shapeEndPoint;
            redrawCanvas();
            drawShapePreview(currentShape);
          }
        } else if (isPanning) {
          const dx = e.clientX - startMouseX;
          const dy = e.clientY - startMouseY;
          panX = startPanX + dx;
          panY = startPanY + dy;
          applyTransform();
        }
      }

      /**
       * Ends drawing or panning when the mouse is released.
       * @param {MouseEvent} e - The mouse event.
       */
      function endDrawing(e) {
        e.preventDefault(); // Prevent selection
        if (drawing) {
          if (drawingMode === 'pencil') {
            history.push(currentPath);
          } else if (drawingMode === 'circle' || drawingMode === 'square') {
            if (currentShape) {
              history.push(currentShape);
              currentShape = null;
            }
          }
          drawing = false;
          shapeStartPoint = null;
          shapeEndPoint = null;
        }
        if (isPanning) {
          isPanning = false;
        }
      }

      /**
       * Handles mouse wheel zooming, centering on the cursor position.
       * @param {WheelEvent} e - The wheel event.
       */
      function handleWheel(e) {
        e.preventDefault();
        const delta = e.deltaY;
        const zoomFactor = 1.1;
        const prevZoom = zoom;
        let newZoom = delta > 0 ? zoom / zoomFactor : zoom * zoomFactor;
        newZoom = Math.max(0.5, Math.min(16, newZoom));

        // Calculate cursor position relative to container
        const containerRect = container.getBoundingClientRect();
        const cursorX = e.clientX - containerRect.left;
        const cursorY = e.clientY - containerRect.top;

        // Adjust pan to keep the cursor point stationary
        panX = cursorX - (cursorX - panX) * (newZoom / prevZoom);
        panY = cursorY - (cursorY - panY) * (newZoom / prevZoom);

        zoom = newZoom;
        applyTransform();
      }

      /**
       * Handles touch start for pinch zoom and panning.
       * @param {TouchEvent} e - The touch event.
       */
      function handleTouchStart(e) {
        if (e.touches.length === 2) {
          const touch1 = e.touches[0];
          const touch2 = e.touches[1];
          initialDistance = Math.hypot(touch2.clientX - touch1.clientX, touch2.clientY - touch1.clientY);
          initialZoom = zoom;
          isPanning = false;
        } else if (e.touches.length === 1) {
          isPanning = true;
          startPanX = panX;
          startPanY = panY;
          startMouseX = e.touches[0].clientX;
          startMouseY = e.touches[0].clientY;
        }
      }

      /**
       * Handles touch move for pinch zoom and panning.
       * @param {TouchEvent} e - The touch event.
       */
      function handleTouchMove(e) {
        if (e.touches.length === 2 && initialDistance !== null) {
          const touch1 = e.touches[0];
          const touch2 = e.touches[1];
          const currentDistance = Math.hypot(touch2.clientX - touch1.clientX, touch2.clientY - touch1.clientY);
          const scale = currentDistance / initialDistance;
          let newZoom = initialZoom * scale;
          newZoom = Math.max(0.5, Math.min(16, newZoom));
          zoom = newZoom;
          applyTransform();
        } else if (e.touches.length === 1 && isPanning) {
          const dx = e.touches[0].clientX - startMouseX;
          const dy = e.touches[0].clientY - startMouseY;
          panX = startPanX + dx;
          panY = startPanY + dy;
          applyTransform();
        }
      }

      /**
       * Handles touch end or cancel for pinch zoom and panning.
       * @param {TouchEvent} e - The touch event.
       */
      function handleTouchEnd(e) {
        if (e.touches.length < 2) {
          initialDistance = null;
          initialZoom = null;
        }
        if (e.touches.length === 0) {
          isPanning = false;
        }
      }

      // Event Listeners
      container.addEventListener('wheel', handleWheel);
      container.addEventListener('mousedown', startDrawing);
      container.addEventListener('mousemove', draw);
      container.addEventListener('mouseup', endDrawing);
      container.addEventListener('mouseleave', endDrawing);
      container.addEventListener('touchstart', handleTouchStart);
      container.addEventListener('touchmove', handleTouchMove);
      container.addEventListener('touchend', handleTouchEnd);
      container.addEventListener('touchcancel', handleTouchEnd);
      container.addEventListener('contextmenu', (e) => e.preventDefault());

      /**
       * Clears the canvas and resets the drawing history.
       */
      function clearCanvas() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        history = [];
        currentPath = [];
        currentShape = null;
        if (doodleImage) {
          doodleImage.remove();
          doodleImage = null;
        }
        handleBackgroundImage(bgImage?.src || null, Number(canvas.dataset.width), Number(canvas.dataset.height));
      }

      /**
       * Undoes the last drawing action.
       */
      function undoCanvas() {
        if (history.length > 0) {
          history.pop();
          redrawCanvas();
        }
      }

      /**
       * Draws a circle on the canvas.
       * @param {CanvasRenderingContext2D} context - The canvas context.
       * @param {number} centerX - The x-coordinate of the circle's center.
       * @param {number} centerY - The y-coordinate of the circle's center.
       * @param {number} radius - The radius of the circle.
       * @param {string} color - The color of the circle's stroke.
       */
      function drawCircle(context, centerX, centerY, radius, color) {
        context.beginPath();
        context.strokeStyle = color;
        context.lineWidth = 2;
        context.arc(centerX, centerY, radius, 0, 2 * Math.PI);
        context.stroke();
      }

      /**
       * Draws a rectangle on the canvas.
       * @param {CanvasRenderingContext2D} context - The canvas context.
       * @param {number} x - The x-coordinate of the rectangle's top-left corner.
       * @param {number} y - The y-coordinate of the rectangle's top-left corner.
       * @param {number} width - The width of the rectangle.
       * @param {number} height - The height of the rectangle.
       * @param {string} color - The color of the rectangle's stroke.
       */
      function drawRectangle(context, x, y, width, height, color) {
        context.beginPath();
        context.strokeStyle = color;
        context.lineWidth = 2;
        context.rect(x, y, width, height);
        context.stroke();
      }

      /**
       * Draws a preview of the current shape being drawn.
       * @param {Object} shapeData - The shape data containing shape type, start, end, and color.
       */
      function drawShapePreview(shapeData) {
        if (!shapeData) return;
        if (shapeData.shape === 'circle') {
          const centerX = shapeData.start.x;
          const centerY = shapeData.start.y;
          const radius = Math.sqrt(Math.pow(shapeData.end.x - centerX, 2) + Math.pow(shapeData.end.y - centerY, 2));
          drawCircle(ctx, centerX, centerY, radius, shapeData.color);
        } else if (shapeData.shape === 'square') {
          const x = Math.min(shapeData.start.x, shapeData.end.x);
          const y = Math.min(shapeData.start.y, shapeData.end.y);
          const width = Math.abs(shapeData.end.x - shapeData.start.x);
          const height = Math.abs(shapeData.end.y - shapeData.start.y);
          drawRectangle(ctx, x, y, width, height, shapeData.color);
        }
      }

      /**
       * Redraws the entire canvas based on the drawing history.
       */
      function redrawCanvas() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        if (doodleImage) {
          ctx.drawImage(doodleImage, 0, 0, canvas.width, canvas.height);
        }
        history.forEach(item => {
          if (Array.isArray(item)) { // Pencil path
            ctx.beginPath();
            item.forEach(point => {
              if (point.start) {
                ctx.strokeStyle = point.color;
                ctx.moveTo(point.x, point.y);
              } else {
                ctx.lineTo(point.x, point.y);
              }
            });
            ctx.stroke();
          } else if (item.shape === 'circle') {
            const centerX = item.start.x;
            const centerY = item.start.y;
            const radius = Math.sqrt(Math.pow(item.end.x - centerX, 2) + Math.pow(item.end.y - centerY, 2));
            drawCircle(ctx, centerX, centerY, radius, item.color);
          } else if (item.shape === 'square') {
            const x = Math.min(item.start.x, item.end.x);
            const y = Math.min(item.start.y, item.end.y);
            const width = Math.abs(item.end.x - item.start.x);
            const height = Math.abs(item.end.y - item.start.y);
            drawRectangle(ctx, x, y, width, height, item.color);
          }
        });
      }

      /**
       * Saves the current canvas as a PNG data URL and sends it to React Native.
       */
      function saveCanvas() {
        const dataUrl = canvas.toDataURL('image/png');
        window.ReactNativeWebView.postMessage(JSON.stringify({ source: 'webview-canvas', payload: dataUrl }));
      }

      /**
       * Calculates the aspect ratio of a given width and height.
       * @param {number} width - The width.
       * @param {number} height - The height.
       * @returns {number} - The aspect ratio (width / height).
       */
      function getAspectRatio(width, height) {
        return width / height;
      }

      /**
       * Scales dimensions while preserving aspect ratio based on max constraints.
       * @param {number} srcWidth - The source width.
       * @param {number} srcHeight - The source height.
       * @param {number|null} maxWidth - The maximum width constraint.
       * @param {number|null} maxHeight - The maximum height constraint.
       * @returns {{width: number, height: number}} - The scaled dimensions.
       */
      function getScaledDimensions(srcWidth, srcHeight, maxWidth, maxHeight) {
        const srcRatio = getAspectRatio(srcWidth, srcHeight);
        let scaledWidth = srcWidth;
        let scaledHeight = srcHeight;
        if (maxWidth != null && maxHeight != null) {
          const maxRatio = getAspectRatio(maxWidth, maxHeight);
          if (srcRatio > maxRatio) {
            scaledWidth = maxWidth;
            scaledHeight = scaledWidth / srcRatio;
          } else {
            scaledHeight = maxHeight;
            scaledWidth = scaledHeight * srcRatio;
          }
        } else if (maxWidth != null) {
          scaledWidth = maxWidth;
          scaledHeight = scaledWidth / srcRatio;
        } else if (maxHeight != null) {
          scaledHeight = maxHeight;
          scaledWidth = scaledHeight * srcRatio;
        }
        return { width: Math.round(scaledWidth), height: Math.round(scaledHeight) };
      }

      /**
       * Sets the canvas dimensions based on provided values or background image aspect ratio.
       * @param {number|null} providedWidth - The desired width.
       * @param {number|null} providedHeight - The desired height.
       * @param {HTMLImageElement|null} backgroundImage - The background image element.
       */
      function setCanvasDimensions(providedWidth, providedHeight, backgroundImage) {
        let targetWidth = providedWidth !== null ? Number(providedWidth) : null;
        let targetHeight = providedHeight !== null ? Number(providedHeight) : null;
        let bgWidth = backgroundImage ? backgroundImage.naturalWidth : null;
        let bgHeight = backgroundImage ? backgroundImage.naturalHeight : null;
        if (targetWidth && targetHeight) {
          canvasResWidth = targetWidth;
          canvasResHeight = targetHeight;
        } else if (backgroundImage && bgWidth && bgHeight) {
          const scaledDimensions = getScaledDimensions(bgWidth, bgHeight, targetWidth || null, targetHeight || null);
          canvasResWidth = scaledDimensions.width;
          canvasResHeight = scaledDimensions.height;
        } else {
          canvasResWidth = 300;
          canvasResHeight = 200;
        }
        canvas.width = canvasResWidth;
        canvas.height = canvasResHeight;
        canvas.dataset.width = canvasResWidth;
        canvas.dataset.height = canvasResHeight;
        if (bgImage) {
          bgImage.style.width = '100%';
          bgImage.style.height = '100%';
        }
      }

      /**
       * Handles loading and setting the background image.
       * @param {string|null} backgroundUri - The URI of the background image.
       * @param {number|null} providedWidth - The desired width.
       * @param {number|null} providedHeight - The desired height.
       */
      function handleBackgroundImage(backgroundUri, providedWidth, providedHeight) {
        if (backgroundUri) {
          if (!bgImage) {
            bgImage = document.createElement('img');
            bgImage.id = 'bgImage';
            container.prepend(bgImage);
          }
          bgImage.src = backgroundUri;
          bgImage.onload = () => {
            setCanvasDimensions(providedWidth, providedHeight, bgImage);
            redrawCanvas();
            applyTransform();
          };
          bgImage.onerror = (error) => {
            log('doodlePadHTML_handleBackgroundImageE1', error);
            setCanvasDimensions(providedWidth, providedHeight, null);
          };
        } else {
          setCanvasDimensions(providedWidth, providedHeight, null);
          if (bgImage) {
            bgImage.remove();
            bgImage = null;
          }
        }
      }

      /**
       * Initializes the color palette with provided colors.
       * @param {string[]} colorPalette - Array of color strings.
       * @param {string} [selectedColor='white'] - The initially selected color.
       */
      function initializeColorPalette(colorPalette, selectedColor = 'white') {
        const paletteDiv = document.getElementById('palette');
        paletteDiv.style.display = 'flex';
        if (colorPalette) {
          paletteDiv.innerHTML = '';
          colorPalette.forEach(color => {
            const swatch = document.createElement('div');
            swatch.className = 'color-swatch';
            swatch.style.backgroundColor = color;
            swatch.dataset.color = color;
            swatch.onclick = () => setColor(color);
            paletteDiv.appendChild(swatch);
          });
        }
        setColor(selectedColor);
      }

      /**
       * Initializes the shape palette and sets the default shape.
       */
      function initializeShapePalette() {
        const shapePaletteDiv = document.getElementById('shape-palette');
        shapePaletteDiv.style.display = 'flex';
        document.getElementById('pencil-button').onclick = () => setDrawingShape('pencil');
        document.getElementById('circle-button').onclick = () => setDrawingShape('circle');
        document.getElementById('square-button').onclick = () => setDrawingShape('square');
        setDrawingShape('pencil');
      }

      /**
       * Loads a doodle image onto the canvas.
       * @param {string|null} doodleUri - The URI of the doodle image.
       */
      function loadDoodleImage(doodleUri) {
        if (doodleUri) {
          if (!doodleImage) {
            doodleImage = document.createElement('img');
            doodleImage.id = 'doodleImage';
          }
          doodleImage.src = doodleUri;
          doodleImage.onload = () => redrawCanvas();
          doodleImage.onerror = (error) => log('doodlePadHTML_loadDoodleImageE1', error);
        } else if (doodleImage) {
          doodleImage.remove();
          doodleImage = null;
          redrawCanvas();
        }
      }

      /**
       * Handles initialization messages from React Native.
       * @param {Object} messageData - The initialization data.
       *   - \`width\`: Canvas width.
       *   - \`height\`: Canvas height.
       *   - \`backgroundUri\`: Data URI for the background image.
       *   - \`doodleUri\`: Data URI for the doodle image.
       *   - \`maximize\`: Boolean indicating if the modal should maximize.
       *   - \`isEditable\`: Boolean indicating if the doodle pad is editable.
       *   - \`colorPalette\`: Array of colors for the palette.
       *   - \`selectedColor\`: Initial selected color.
       */
      function handleInitMessage(messageData) {
        let providedWidth = messageData.width !== undefined ? Number(messageData.width) : null;
        let providedHeight = messageData.height !== undefined ? Number(messageData.height) : null;
        const backgroundUri = messageData.backgroundUri;
        const doodleUri = messageData.doodleUri;
        const maximize = messageData.maximize;
        const isEditable = messageData.isEditable;
        const paletteColors = messageData.colorPalette;
        const selectedColor = messageData.selectedColor;

        setColor(selectedColor);
        handleBackgroundImage(backgroundUri, providedWidth, providedHeight);
        loadDoodleImage(doodleUri);

        if (isEditable) {
          initializeColorPalette(paletteColors, selectedColor);
          initializeShapePalette();
        }
        applyTransform();
      }

      const onMessage = (event) => {
        if (event.data && typeof event.data === 'string') {
          try {
            const messageData = JSON.parse(event.data);
            if (messageData && messageData.source !== 'react-devtools-bridge') {
              if (messageData.type === 'init') {
                handleInitMessage(messageData);
              }
            }
          } catch (error) {
            log("doodlePadHTML_onMessageE1", event.data, error);
          }
        }
      };
      window.addEventListener('message', onMessage);
      document.addEventListener('message', onMessage);
    </script>
  </body>
  </html>
`;

/**
 * A React Native Web component that provides a doodle pad interface for free-form drawing using a WebView.
 *
 * The `DoodlePad` component allows users to draw free-form doodles on a canvas within a WebView.
 * It supports setting a background image, saving the doodle as a Data URI, undo/redo functionality,
 * color selection, and can be used in both editable and read-only modes. The doodle is rendered
 * within a modal that can be maximized to full screen or displayed at a 1:1 resolution.
 *
 * @param {DoodlePadProps} props - The properties for the DoodlePad component, defining its behavior and appearance.
 * @returns {JSX.Element} The DoodlePad component instance.
 *
 * @example
 * ```tsx
 * import { DoodlePad } from '@dwidge/components-expo';
 * import { useAsyncState } from '@dwidge/hooks-react';
 * import { View, Image } from 'react-native';
 *
 * function MyComponent() {
 *   const [doodleUri, setDoodleUri] = useAsyncState<DataUri | null>(null);
 *
 *   return (
 *     <View>
 *       <DoodlePad doodleUri={[doodleUri, setDoodleUri]} width={400} height={300} />
 *       {doodleUri && <Image source={{ uri: doodleUri }} style={{ width: 200, height: 150 }} />}
 *     </View>
 *   );
 * }
 * ```
 */
export const DoodlePad = ({
  doodleUri: [doodleUri, setDoodleUri] = useAsyncState<DataUri | null>(null),
  width,
  height,
  backgroundUri,
  backgroundColor,
  style,
  maximize = true,
  log = (...args) => {}, //console.log(...args),
}: DoodlePadProps) => {
  const webViewRef = useRef<WebView>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedColor, setSelectedColor] = useState<string>("white");
  const isEditable = setDoodleUri !== undefined;
  const [webViewReady, setWebViewReady] = useState(false);

  // useEffect to send init message when WebView is ready and modal is visible
  useEffect(() => {
    if (webViewReady && !modalVisible) setWebViewReady(false);
    if (
      modalVisible &&
      webViewReady &&
      webViewRef.current &&
      backgroundUri !== undefined &&
      doodleUri !== undefined
    ) {
      // Check webViewReady
      webViewRef.current.postMessage(
        JSON.stringify({
          type: "init",
          width,
          height,
          backgroundUri,
          doodleUri: doodleUri,
          maximize,
          isEditable,
          colorPalette,
          selectedColor,
        }),
      );
    }
  }, [
    modalVisible,
    webViewReady,
    webViewRef,
    width,
    height,
    backgroundUri,
    doodleUri,
    maximize,
    isEditable,
    selectedColor,
  ]);

  /**
   * Handles messages received from the WebView, processing canvas data and logs.
   *
   * - If the source is 'webview-canvas', it extracts the Data URI payload, converts it to a DataUri object using `asDataUri`,
   *   updates the `doodleUri` state using the provided `setDoodleUri` setter, and closes the modal.
   * - If the source is 'webview-log', it logs the payload to the console, useful for debugging WebView-side logs in React Native.
   * - For any other or unrecognized messages, it logs a warning indicating a parsing error or unknown message source.
   *
   * @param {object} event - The event object from the WebView, containing the message data.
   * @param {object} event.nativeEvent - Native event details.
   * @param {string} event.nativeEvent.data - The string data sent from the WebView.
   */
  const onMessage = useCallback(
    (event: { nativeEvent: { data: string } }) => {
      const message = event.nativeEvent.data;

      if (typeof message === "string") {
        try {
          const parsedMessage = JSON.parse(message);
          const { source, payload }: { source: string; payload: any } =
            parsedMessage;
          if (source.startsWith("webview"))
            if (source === "webview-canvas" && setDoodleUri) {
              if (typeof payload !== "string")
                throw new Error("DoodlePad_onMessageE1: Payload not a string");
              setDoodleUri(asDataUri(payload));
              setModalVisible(false);
            } else if (source === "webview-log") {
              log("DoodlePad_onMessage1:", payload);
            }
        } catch (error) {
          console.warn("DoodlePad_onMessageE2:", message, error);
        }
      }
    },
    [setDoodleUri],
  );

  /**
   * Closes the doodle editor modal without saving the current canvas drawing.
   */
  const cancelCanvas = useCallback(() => {
    setModalVisible(false);
  }, []);

  /**
   * Injects JavaScript into the WebView to trigger the canvas saving function.
   */
  const saveCanvasFn = useCallback(() => {
    webViewRef.current?.injectJavaScript(`saveCanvas();`);
  }, []);

  /**
   * Injects JavaScript into the WebView to trigger the canvas clearing function.
   */
  const clearCanvasFn = useCallback(() => {
    webViewRef.current?.injectJavaScript(`clearCanvas();`);
  }, []);

  /**
   * Injects JavaScript into the WebView to trigger the undo canvas function.
   */
  const undoCanvasFn = useCallback(() => {
    webViewRef.current?.injectJavaScript(`undoCanvas();`);
  }, []);

  /**
   * Handles the WebView's `onLoad` event, indicating that the WebView content has finished loading.
   *
   * This function is called when the WebView successfully loads its content (i.e., `doodlePadHTML`).
   * It sets the `webViewReady` state to `true`, signaling that the WebView is ready to receive messages
   * and JavaScript injections. This is crucial for ensuring that initialization messages are sent to the
   * WebView only after it is fully loaded and responsive.
   */
  const handleWebViewLoad = useCallback(() => {
    log("DoodlePad1: WebView loaded successfully");
    setWebViewReady(true); // Set webViewReady to true when WebView loads
  }, []);

  if (backgroundUri === undefined || doodleUri === undefined) return null;
  return (
    <Fragment>
      <TouchableOpacity
        onPress={() => setModalVisible(true)}
        disabled={!isEditable && !doodleUri}
      >
        <CompositeImage
          images={[backgroundUri, doodleUri]}
          style={[{ height }, style]}
        />
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={maximize ? false : true}
      >
        <StyledView
          background={maximize}
          backgroundAlpha={!maximize}
          sgap
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            padding: 10,
          }}
        >
          <StyledView
            style={{
              flex: 1,
              width: "100%",
              maxWidth: maximize ? "100%" : width,
              maxHeight: maximize ? "100%" : height,
            }}
          >
            <WebView
              ref={webViewRef}
              originWhitelist={["*"]}
              source={{ html: doodlePadHTML }}
              javaScriptEnabled
              onMessage={onMessage}
              style={{
                flex: 1,
                backgroundColor,
              }}
              onLoad={handleWebViewLoad}
            />
          </StyledView>
          <StyledView row sgap>
            {isEditable ? (
              <>
                <StyledButton title="Cancel" onPress={cancelCanvas} />
                <StyledButton title="Undo" onPress={undoCanvasFn} />
                <StyledButton title="Clear" onPress={clearCanvasFn} />
                <StyledButton title="Save" onPress={saveCanvasFn} />
              </>
            ) : (
              <StyledButton title="Close" onPress={cancelCanvas} />
            )}
          </StyledView>
        </StyledView>
      </Modal>
    </Fragment>
  );
};
