import { StyledButton, StyledView } from "@dwidge/components-rnw";
import { asDataUri, DataUri } from "@dwidge/file-cache-expo";
import { AsyncState, OptionalState, useAsyncState } from "@dwidge/hooks-react";
import { WebView } from "@dwidge/react-native-web-webview";
import { Fragment, useCallback, useEffect, useRef, useState } from "react";
import { Modal, StyleProp, TouchableOpacity, ViewStyle } from "react-native";
import { CompositeImage } from "./CompositeImage.js";

const log = (...args) => {};
// const log = (...args) => console.log(...args);

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
   * - **First element:** The current doodle data URI (string or null).  Represents the current state of the doodle.
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
}

/**
 * Array of colors available in the doodle pad palette.
 *
 * This array defines the default color options presented to the user within the doodle editor.
 * Users can select colors from this palette to draw on the canvas.
 */
const colorPalette = [
  "red",
  "green",
  "blue",
  "yellow",
  "orange",
  "purple",
  "cyan",
  "magenta",
  "brown",
  "black",
  "gray",
  "white",
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
        margin: 0; padding: 0; height: 100%; overflow: hidden; }
      #container {
        position: relative;
        width: 100%;
        height: 100%;
        border: solid 2px grey;
        box-sizing: border-box;
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
    </style>
  </head>
  <body>
    <div id="container">
      <canvas id="padCanvas"></canvas>
      <div id="palette" style="display:none;"></div>
    </div>
    <script>
      const canvas = document.getElementById('padCanvas');
      const ctx = canvas.getContext('2d');
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      let drawing = false;
      let history = [];
      let currentPath = [];
      let currentColor = 'red';
      ctx.strokeStyle = currentColor;
      let bgImage = null;
      let canvasResWidth = null;
      let canvasResHeight = null;
      let selectedSwatch = null;
      let doodleImage = null;

      /**
       * Logs messages to the console and relays them to the React Native side via WebView messaging.
       *
       * This function is used for debugging purposes within the WebView. It outputs messages to the WebView's
       * console and also sends a stringified JSON message to the React Native side, allowing logs to be captured
       * in the React Native environment as well.
       *
       * @param {...*} args - Arguments to be logged. These can be of any type and will be stringified for messaging.
       */
      function log2(...args) {
        console.log(...args); // Keep console.log for WebView's own console
        window.ReactNativeWebView.postMessage(JSON.stringify({ source: 'webview-log', payload: args })); // Relay log to RN
      }
      const log = (...args) => {};

      /**
       * Sets the current drawing color, updates the canvas context's stroke style, and reflects the selection in the color palette UI.
       *
       * @param {string} color - The color to set for drawing. This should be a valid CSS color string (e.g., 'red', '#00FF00', 'rgb(0, 0, 255)').
       */
      function setColor(color) {
        log('setColor called with color:', color);
        currentColor = color;
        ctx.strokeStyle = currentColor;
        log('ctx.strokeStyle set to:', ctx.strokeStyle);

        // Update selected swatch visual feedback
        if (selectedSwatch) {
          selectedSwatch.classList.remove('selected');
        }
        selectedSwatch = document.querySelector(\`.color-swatch[data-color="\${color}"]\`);
        if (selectedSwatch) {
          selectedSwatch.classList.add('selected');
        }
      }

      /**
       * Converts screen coordinates (clientX, clientY) to canvas-relative coordinates,
       * accounting for \`object-fit: contain\` scaling.
       *
       * This function is essential for accurately positioning drawing strokes on the canvas, as it accounts for
       * the canvas's position within the viewport and any potential scaling applied by CSS. It calculates the
       * scaling factors based on the canvas's internal resolution (\`canvas.width\`, \`canvas.height\`) and its
       * rendered size in the browser (\`rect.width\`, \`rect.height\`).
       *
       * @param {number} clientX - The horizontal coordinate of the event relative to the viewport.
       * @param {number} clientY - The vertical coordinate of the event relative to the viewport.
       * @returns {{x: number, y: number}} An object containing the \`x\` and \`y\` coordinates adjusted to be relative to the canvas drawing surface.
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
          // Canvas is wider than the container (or same width ratio) - vertical padding
          scaleY = scaleX; // Scale based on width to fit horizontally
          const scaledCanvasHeight = canvasHeight * (rectWidth / canvasWidth); // Height after width-based scaling
          offsetY = (rectHeight - scaledCanvasHeight) / 2; // Calculate vertical offset
        } else if (canvasAspectRatio < rectAspectRatio) {
          // Canvas is taller than the container (or same height ratio) - horizontal padding
          scaleX = scaleY; // Scale based on height to fit vertically
          const scaledCanvasWidth = canvasWidth * (rectHeight / canvasHeight); // Width after height-based scaling
          offsetX = (rectWidth - scaledCanvasWidth) / 2;     // Calculate horizontal offset
        } else {
          // Aspect ratios are the same, or very close - no offset, scales directly
        }


        return {
          x: (clientX - rect.left - offsetX) * scaleX,
          y: (clientY - rect.top - offsetY) * scaleY
        };
      }

      /**
       * Handles the start of a new drawing path when a user initiates a touch or mouse drag.
       *
       * @param {MouseEvent|TouchEvent} e - The event object associated with the start of the drawing action (either a mouse or touch event).
       */
      function startDrawing(e) {
        log('startDrawing event:', e.type);
        drawing = true;
        ctx.beginPath(); // Ensure beginPath is called at the start
        ctx.strokeStyle = currentColor; // Re-set strokeStyle at the start of drawing
        ctx.lineWidth = 2; // Re-set lineWidth at the start of drawing
        ctx.lineCap = 'round'; // Re-set lineCap at the start of drawing

        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        const canvasCoords = getCanvasRelativeCoords(clientX, clientY);

        log('startDrawing coords:', { clientX, clientY, canvasCoords });
        ctx.moveTo(canvasCoords.x, canvasCoords.y);
        currentPath = [{ x: canvasCoords.x, y: canvasCoords.y, start: true, color: currentColor }];
      }

      /**
       * Handles the drawing process as the user moves their touch or mouse while drawing.
       *
       * @param {MouseEvent|TouchEvent} e - The event object associated with the move action during drawing (mouse or touch move event).
       */
      function draw(e) {
        if (!drawing) return;
        log('draw event:', e.type);

        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        const canvasCoords = getCanvasRelativeCoords(clientX, clientY);

        log('draw coords:', { clientX, clientY, canvasCoords });
        ctx.lineTo(canvasCoords.x, canvasCoords.y);
        ctx.stroke();
        currentPath.push({ x: canvasCoords.x, y: canvasCoords.y, color: currentColor });
      }

      /**
       * Handles the end of a drawing path when the user lifts their touch or releases the mouse button.
       */
      function endDrawing() {
        log('endDrawing event');
        if (drawing) {
          history.push(currentPath);
        }
        drawing = false;
      }

      canvas.addEventListener('touchstart', startDrawing);
      canvas.addEventListener('touchmove', draw);
      canvas.addEventListener('touchend', endDrawing);
      canvas.addEventListener('mousedown', startDrawing);
      canvas.addEventListener('mousemove', draw);
      canvas.addEventListener('mouseup', endDrawing);
      canvas.addEventListener('mouseleave', endDrawing);

      /**
       * Clears the entire canvas, removing all drawings and resetting the drawing history.
       */
      function clearCanvas() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        history = [];
        currentPath = [];
        if (doodleImage) {
          doodleImage.remove();
          doodleImage = null;
        }
        // After clearing, reset canvas dimensions based on background image or default
        handleBackgroundImage(bgImage?.src || null, Number(canvas.dataset.width), Number(canvas.dataset.height));
      }

      /**
       * Undoes the last drawing action by removing the most recent path from the history and redrawing the canvas.
       */
      function undoCanvas() {
        if (history.length > 0) {
          history.pop();
          redrawCanvas();
        }
      }

      /**
       * Redraws the entire canvas from scratch based on the drawing history.
       */
      function redrawCanvas() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        if (doodleImage) {
          ctx.drawImage(doodleImage, 0, 0, canvas.width, canvas.height);
        }
        history.forEach(path => {
          ctx.beginPath();
          path.forEach(point => {
            if(point.start) {
              ctx.strokeStyle = point.color;
              ctx.moveTo(point.x, point.y);
            } else {
              ctx.lineTo(point.x, point.y);
            }
          });
          ctx.stroke();
        });
      }

      /**
       * Saves the current canvas content as a Data URL and sends it back to the React Native side.
       */
      function saveCanvas() {
        const dataUrl = canvas.toDataURL('image/png');
        window.ReactNativeWebView.postMessage(JSON.stringify({ source: 'webview-canvas', payload: dataUrl }));
      }

      /**
       * Calculates the aspect ratio (width divided by height) of given dimensions.
       *
       * @param {number} width - The width value.
       * @param {number} height - The height value.
       * @returns {number} The aspect ratio, calculated as \`width / height\`. Returns \`NaN\` if height is zero.
       */
      function getAspectRatio(width, height) {
        return width / height;
      }

      /**
       * Calculates scaled dimensions (width and height) to fit within optional maximum constraints while preserving aspect ratio.
       *
       * This function is useful for resizing images or canvas dimensions to fit within a specified area without distortion.
       * It takes source dimensions and optional maximum width and/or height constraints. If both constraints are provided,
       * it ensures that the scaled dimensions fit within both. If only one constraint is given, it scales based on that constraint
       * and maintains the aspect ratio. If no constraints are provided, it returns the original dimensions. The function uses
       * {@link getAspectRatio} to maintain the correct proportions during scaling.
       *
       * @param {number} srcWidth The original width of the source image or content.
       * @param {number} srcHeight The original height of the source image or content.
       * @param {number | null} maxWidth The maximum allowed width, or null if unconstrained horizontally.
       * @param {number | null} maxHeight The maximum allowed height, or null if unconstrained vertically.
       * @returns {{width: number, height: number}} An object containing the scaled width and height, rounded to the nearest integer.
       */
      function getScaledDimensions(srcWidth, srcHeight, maxWidth, maxHeight) {
        const srcRatio = getAspectRatio(srcWidth, srcHeight);
        let scaledWidth = srcWidth;
        let scaledHeight = srcHeight;

        if (maxWidth != null && maxHeight != null) {
          // Both width and height constraints are provided
          const maxRatio = getAspectRatio(maxWidth, maxHeight);
          if (srcRatio > maxRatio) {
            // Source is wider than max ratio, fit to maxWidth
            scaledWidth = maxWidth;
            scaledHeight = scaledWidth / srcRatio;
          } else {
            // Source is taller or same ratio, fit to maxHeight
            scaledHeight = maxHeight;
            scaledWidth = scaledHeight * srcRatio;
          }
        } else if (maxWidth != null) {
          // Only maxWidth is provided, scale height based on aspect ratio
          scaledWidth = maxWidth;
          scaledHeight = scaledWidth / srcRatio;
        } else if (maxHeight != null) {
          // Only maxHeight is provided, scale width based on aspect ratio
          scaledHeight = maxHeight;
          scaledWidth = scaledHeight * srcRatio;
        }
        return { width: Math.round(scaledWidth), height: Math.round(scaledHeight) }; // Round to avoid subpixel issues
      }

      /**
       * Determines and sets the canvas dimensions based on provided width, height, and background image availability.
       *
       * This function calculates and applies the appropriate width and height to the canvas element (\`canvas\`).
       * It prioritizes explicitly provided \`width\` and \`height\` props. If these are not given but a \`backgroundImage\`
       * is available, it sizes the canvas to match the image's aspect ratio, ensuring the entire image is visible within
       * the canvas. If neither dimensions nor a background image are provided, it defaults to predefined dimensions (300x200).
       * It also stores the calculated canvas dimensions as data attributes on the canvas for later use (e.g., resetting on clear).
       * If a background image is present, it ensures that the image's style is set to fill the new canvas dimensions.
       *
       * @param {number | null} providedWidth - The width provided as a prop, or null if not provided.
       * @param {number | null} providedHeight - The height provided as a prop, or null if not provided.
       * @param {HTMLImageElement | null} backgroundImage - The background image element, if available, or null.
       */
      function setCanvasDimensions(providedWidth, providedHeight, backgroundImage) {
        log('setCanvasDimensions called with:', { providedWidth, providedHeight, backgroundImage });
        let targetWidth = providedWidth !== null ? Number(providedWidth) : null;
        let targetHeight = providedHeight !== null ? Number(providedHeight) : null;
        let bgWidth = backgroundImage ? backgroundImage.naturalWidth : null;
        let bgHeight = backgroundImage ? backgroundImage.naturalHeight : null;

        if (targetWidth && targetHeight) {
          // Width and height are explicitly provided, use them directly.
          canvasResWidth = targetWidth;
          canvasResHeight = targetHeight;
        } else if (backgroundImage && bgWidth && bgHeight) {
          // Background image is available, and no explicit dimensions provided, scale canvas to image aspect ratio.
          const scaledDimensions = getScaledDimensions(bgWidth, bgHeight, targetWidth || null, targetHeight || null);
          canvasResWidth = scaledDimensions.width;
          canvasResHeight = scaledDimensions.height;
        } else {
          // No background image or explicit dimensions, use default dimensions.
          canvasResWidth = 300;
          canvasResHeight = 200;
        }

        canvas.width = canvasResWidth;
        canvas.height = canvasResHeight;
        canvas.dataset.width = canvasResWidth; // Store for reset on clearCanvas
        canvas.dataset.height = canvasResHeight; // Store for reset on clearCanvas
        log('Canvas dimensions set to:', canvas.width, canvas.height);

        // If background image exists, ensure it's resized to fit the new canvas dimensions.
        if (bgImage) {
          bgImage.style.width = '100%'; // Ensure bgImage resizes to canvas width
          bgImage.style.height = '100%'; // Ensure bgImage resizes to canvas height
        }
      }

      /**
       * Handles the loading and management of the background image for the doodle pad.
       *
       * @param {string} backgroundUri - The URI (typically a Data URI) of the background image to load. Can be null or undefined to remove the background image.
       * @param {number} providedWidth - The width provided as a prop, used as a hint for canvas dimensioning.
       * @param {number} providedHeight - The height provided as a prop, used as a hint for canvas dimensioning.
       */
      function handleBackgroundImage(backgroundUri, providedWidth, providedHeight) {
        log('handleBackgroundImage called with URI:', backgroundUri ? backgroundUri.slice(0, 50) + '...' : backgroundUri);

        if (backgroundUri) {
          log('Creating bgImage element');
          if (!bgImage) {
            bgImage = document.createElement('img');
            bgImage.id = 'bgImage';
            document.getElementById('container').prepend(bgImage); // Add to DOM only once
          }
          log('Setting bgImage.src:', backgroundUri.slice(0, 50) + '...');
          bgImage.src = backgroundUri;

          bgImage.onload = () => {
            log('Background image onload triggered - SUCCESS');
            log('Image natural dimensions:', bgImage.naturalWidth, bgImage.naturalHeight);
            setCanvasDimensions(providedWidth, providedHeight, bgImage);
            redrawCanvas(); // Redraw to ensure doodle is on top of new background
            log('bgImage loaded and canvas resized.');
          };

          bgImage.onerror = (error) => {
            log('Background image onerror triggered - FAILURE', error);
            setCanvasDimensions(providedWidth, providedHeight, null); // Set canvas dimensions even if bgImage fails, defaulting to props or default
            log('Canvas dimensions set (onerror) to:', canvas.width, canvas.height);
          };
        } else {
          log('No backgroundUri provided, setting canvas dimensions directly.');
          setCanvasDimensions(providedWidth, providedHeight, null);
          if (bgImage) { // Remove bgImage if no backgroundUri is provided anymore.
            bgImage.remove();
            bgImage = null;
          }
          log('Canvas dimensions set (no bgImage) to:', canvas.width, canvas.height);
        }
      }

      /**
       * Initializes the color palette UI in the WebView.
       *
       * @param {string[]} colorPalette - An array of color strings to populate the palette.
       * @param {string} selectedColor - The color to be initially selected in the palette.
       */
      function initializeColorPalette(colorPalette, selectedColor='red') {
        log('initializeColorPalette called');
        const paletteDiv = document.getElementById('palette');
        paletteDiv.style.display = 'flex';
        if (colorPalette) {
          paletteDiv.innerHTML = ''; // Clear existing palette if any
          colorPalette.forEach(color => {
            const swatch = document.createElement('div');
            swatch.className = 'color-swatch';
            swatch.style.backgroundColor = color;
            swatch.dataset.color = color; // Store color in data attribute
            swatch.onclick = () => { setColor(color); };
            paletteDiv.appendChild(swatch);
          });
        }
        // Initialize selected color swatch visual
        setColor(selectedColor);
      }

      /**
       * Loads a doodle image from a Data URI onto the canvas as a base drawing layer.
       *
       * @param {string} doodleUri - The Data URI of the doodle image to load. Can be null or undefined to clear any loaded doodle image.
       */
      function loadDoodleImage(doodleUri) {
        log('loadDoodleImage called with URI:', doodleUri ? doodleUri.slice(0, 50) + '...' : doodleUri);
        if (doodleUri) {
          if (!doodleImage) {
            doodleImage = document.createElement('img');
            doodleImage.id = 'doodleImage';
          }
          doodleImage.src = doodleUri;
          doodleImage.onload = () => {
            log('Doodle image loaded.');
            redrawCanvas(); // Redraw to ensure doodle is on top, and new doodle is displayed.
          };
          doodleImage.onerror = (error) => {
            log('Error loading doodle image:', error);
          };
        } else if (doodleImage) {
          doodleImage.remove(); // Remove doodle image if no doodleUri is provided.
          doodleImage = null;
          redrawCanvas(); // Redraw to clear any old doodle.
        }
      }


      /**
       * Handles the 'init' message received from the React Native side, initializing the doodle pad WebView.
       *
       * @param {object} messageData - An object containing the initialization data sent from React Native. Expected properties include:
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
        log('handleInitMessage called with:', messageData);

        // Parse width and height as numbers, defaulting to null if not provided.
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
        }
      }


      window.addEventListener('message', (event) => {
        if (event.data && typeof event.data === 'string') {
          try {
            const messageData = JSON.parse(event.data);
            if (messageData && messageData.source !== 'react-devtools-bridge') {
              if (messageData.type === 'init') {
                log('init message received in WebView:', messageData); // Keep this log
                handleInitMessage(messageData);
              }
            }
          } catch (error) {
            log("Error parsing message in WebView:", event.data, error);
          }
        }
      });
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
}: DoodlePadProps) => {
  const webViewRef = useRef<WebView>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedColor, setSelectedColor] = useState<string>("red");
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
            log("onMessage1: Message from WebView", parsedMessage);

          if (source === "webview-canvas" && setDoodleUri) {
            if (typeof payload !== "string")
              throw new Error("Payload not a string");
            setDoodleUri(asDataUri(payload));
            setModalVisible(false);
          } else if (source === "webview-log") {
            log("WebView Log:", payload);
          }
        } catch (error) {
          console.warn("Error parsing message:", message, error);
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
    log("WebView loaded successfully");
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
