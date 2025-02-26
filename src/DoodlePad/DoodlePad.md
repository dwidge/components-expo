# DoodlePad Component Design Document

## 1. Introduction

This document outlines the design and functionality of the `DoodlePad` React Native/Web component. This component allows users to create free-form drawings and annotations directly within an application. It is designed to be versatile and particularly useful for annotating images, such as photos of machinery or rooms, but can also be used as a general-purpose drawing tool.

This document is intended for developers who will be using and maintaining the `DoodlePad` component. It details the component's features, usage, and internal workings.

## 2. Existing Features

The current `DoodlePad` component provides the following core functionalities:

- **Cross-Platform Compatibility:** Works seamlessly on both React Native (iOS and Android) and Web platforms thanks to the use of a WebView and HTML Canvas.
- **Drawing Canvas:** Renders a touch and mouse-responsive drawing area using an HTML5 Canvas element embedded in a WebView.
- **Data URI Management:**
  - **State Management:** Utilizes React hooks (`useAsyncState` or `OptionalState`) to manage the doodle as a Data URI (PNG format). This allows for integration with application state management.
  - **Editable and Read-Only Modes:**
    - **Editable Mode:** When a state setter function (`setDoodleUri`) is provided via the `doodleUri` prop, the component becomes interactive. Users can draw, save, clear, and undo their actions.
    - **Read-Only Mode:** If `setDoodleUri` is omitted (only a getter for `doodleUri` is provided), the component displays an existing doodle from the provided `doodleUri` (if any). It becomes a display-only component.
  - **Initial Data Loading:** If an initial `doodleUri` is provided, the component will load and display this doodle upon initialization.
- **Customizable Dimensions:** `width` and `height` props allow developers to specify the resolution of the doodle canvas. These dimensions are independent of the rendered size of the component in the UI.
- **Color Palette:** In editable mode, a predefined color palette is displayed within the modal, allowing users to select drawing colors. The default palette includes red, green, blue, yellow, orange, purple, cyan, magenta, brown, black, gray, and white.
- **Undo Functionality:** An "Undo" button is available in editable mode, enabling users to revert the last drawn stroke.
- **Clear Canvas Functionality:** A "Clear" button clears the entire doodle canvas.
- **Background Support:**
  - **Background Image:** The `backgroundUri` prop allows setting a static background image (Data URI) for the doodle pad. This is useful for annotating existing images. The doodle canvas intelligently attempts to match the aspect ratio of the background image.
  - **Background Color:** The `backgroundColor` prop allows setting a solid background color for the canvas, visible when no background image is used.
  - **Background Interaction:** Background images and colors are for visual context and are not part of the editable doodle itself. The doodle drawing occurs on a transparent layer on top of the background.
- **Modal Presentation:** The doodle pad interface (canvas, palette, buttons) is presented within a modal. This keeps the doodle functionality contained and allows for a cleaner integration into various screen layouts. The modal can be displayed in full-screen mode or centered with 1:1 resolution based on the `maximize` prop.
- **Preview Area:** When the modal is closed, the component renders a `TouchableOpacity` that acts as a preview of the doodle. If a doodle exists, it shows a composite image of the background and doodle; otherwise, it displays a placeholder based on whether the component is in editable mode or not.
- **Maximize Mode:** The `maximize` prop controls whether the doodle editor modal is displayed in full-screen mode (default) or at 1:1 resolution centered on the screen. Full-screen mode scales the canvas and background to fit the screen while maintaining aspect ratio. 1:1 mode displays the doodle at its actual resolution, potentially scaled down to fit.
- **Styling:** The `style` prop allows applying custom styles to the preview area, affecting the `TouchableOpacity` and `CompositeImage` that are rendered when the modal is closed.

## 3. Proposed Features and Enhancements

To further enhance the `DoodlePad` component, especially for annotation purposes, the following features are proposed:

- **Shape Tools:**
  - **Description:** Add tools to draw predefined shapes like rectangles, circles, lines, and arrows. This would make annotations more structured and precise, especially for highlighting specific areas or pointing out features in images.
  - **Implementation:** Implement buttons in the modal to switch between different shape tools and free-drawing mode. The canvas script would need to handle drawing these shapes based on user interactions (drag to define rectangle corners, circle radius, line endpoints, etc.).
- **Text Tool:**
  - **Description:** Allow users to add text annotations directly onto the doodle canvas. This is crucial for labeling parts of images or adding textual descriptions to annotations.
  - **Implementation:** Add a "Text" tool button. Upon selection, tapping on the canvas would trigger a text input (potentially using a native input in React Native or a simple `contenteditable` div in the WebView for web). The entered text would then be rendered onto the canvas at the tapped location. Consider options for font size and color.
- **Eraser Tool:**
  - **Description:** Provide an eraser tool to remove parts of the doodle. This is essential for correcting mistakes and refining annotations.
  - **Implementation:** Add an "Eraser" tool button. When active, drawing on the canvas would effectively "erase" existing strokes by drawing with a transparent or background-colored stroke (depending on desired eraser behavior - hard or soft eraser).
- **Stroke Width Control:**
  - **Description:** Allow users to adjust the thickness (stroke width) of their drawing lines and shapes. This adds flexibility and control over annotation visibility.
  - **Implementation:** Introduce a slider or stepper control in the modal to adjust the `ctx.lineWidth` in the canvas script. This control should dynamically update the drawing stroke width.
- **Zoom and Pan:**
  - **Description:** Enable users to zoom in and pan around the canvas, especially when working with detailed images or making precise annotations. This is critical for annotating high-resolution photos.
  - **Implementation:** This is more complex. Consider using a library within the WebView to handle canvas zooming and panning, or implement it manually by adjusting the canvas transformation matrix (`ctx.scale`, `ctx.translate`). Touch and mouse gestures for zoom/pan need to be implemented.
- **Improved Color Picker:**
  - **Description:** Replace the fixed color palette with a more flexible color picker. Options include a hue-saturation-lightness (HSL) picker or a standard color wheel, allowing users to select a wider range of colors and custom shades.
  - **Implementation:** Integrate a JavaScript color picker library into the WebView, or implement a custom color picker UI using HTML/CSS/JS. The selected color should be communicated back to the canvas context.
- **Saving Annotations as JSON Overlay (Future Enhancement - More Complex):**
  - **Description:** Instead of only saving the doodle as a rasterized PNG, consider an advanced feature to save annotations as a JSON overlay on top of the base image. This would store annotations as objects (shapes, text, paths, their properties, and positions).
  - **Benefits:**
    - **Editability:** Annotations could be edited and manipulated later.
    - **Data Extraction:** Annotation data could be programmatically extracted and analyzed.
    - **Smaller Data Size:** JSON overlay might be more efficient than storing the entire canvas as a PNG, especially for complex annotations on large images.
  - **Implementation:** This is a significant undertaking. It would require:
    - Modifying the canvas script to track annotations as objects instead of just drawing paths.
    - Developing a JSON format to represent annotations.
    - Implementing save and load functionality for this JSON format, along with the base image.
    - Potentially requiring a more sophisticated state management for annotations.
  - **Consider this as a Phase 2 feature.** For now, sticking with PNG data URI is simpler and sufficient for many use cases.

## 4. Component Explanation for Developers

### 4.1. Props

The `DoodlePad` component accepts the following props:

| Prop Name         | Type                                                            | Description                                                                                                                                                                                                                                                                                                                |
| ----------------- | --------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `doodleUri`       | `AsyncState<DataUri \| null> \| OptionalState<DataUri \| null>` | A state tuple to manage the doodle data URI. The first element is the getter for the current doodle Data URI (or null). The second element (optional) is the setter function. If only a getter is provided, the component is read-only. If `doodleUri` is `undefined`, the component will not render doodle functionality. |
| `width`           | `number` (optional)                                             | The drawing resolution width of the doodle canvas in pixels. If not provided, and `backgroundUri` is given, it's derived from the background image width, potentially adjusted by `height`. Defaults to viewport width if neither `width`, `height`, nor `backgroundUri` are provided.                                     |
| `height`          | `number` (optional)                                             | The drawing resolution height of the doodle canvas in pixels. If not provided, and `backgroundUri` is given, it's derived from the background image height, potentially adjusted by `width`. Defaults to viewport height if neither `width`, `height`, nor `backgroundUri` are provided.                                   |
| `backgroundUri`   | `DataUri \| null` (optional)                                    | A Data URI for a background image to display behind the doodle canvas. If provided, the canvas aspect ratio is intelligently adjusted to match the image.                                                                                                                                                                  |
| `backgroundColor` | `string` (optional)                                             | A background color for the drawing area, visible when no `backgroundUri` is provided.                                                                                                                                                                                                                                      |
| `style`           | `StyleProp<ViewStyle>` (optional)                               | Style properties to apply to the preview area, encompassing the `TouchableOpacity` and `CompositeImage`.                                                                                                                                                                                                                   |
| `maximize`        | `boolean` (optional)                                            | Determines if the editor modal should display in full-screen mode (`true`, default) or centered at 1:1 resolution (`false`). Defaults to `true`.                                                                                                                                                                           |

### 4.2. Usage

To use the `DoodlePad` component in your project:

1.  **Import the Component:**

    ```typescript jsx
    import { DoodlePad } from "./path/to/DoodlePad"; // Adjust path as necessary
    ```

2.  **Basic Implementation with State Management (Editable):**

    ```typescript jsx
    import React from 'react';
    import { useAsyncState } from '@dwidge/hooks-react';
    import { View, Image } from 'react-native';

    function MyComponent() {
      const [doodleUri, setDoodleUri] = useAsyncState<DataUri | null>(null);

      return (
        <View>
          <DoodlePad doodleUri={[doodleUri, setDoodleUri]} />
          {doodleUri && (
            <Image source={{ uri: doodleUri }} style={{ width: 200, height: 100 }} />
          )}
        </View>
      );
    }
    ```

3.  **Read-Only Implementation (Display Only):**

    ```typescript jsx
    import React from 'react';
    import { View, Image } from 'react-native';

    function DisplayDoodle({ existingDoodleUri }: { existingDoodleUri: DataUri | null }) {
      return (
        <View>
          <DoodlePad doodleUri={[existingDoodleUri]} />
        </View>
      );
    }
    ```

4.  **Using Background Image and Color:**

    ```typescript jsx
    import React from 'react';
    import { useAsyncState } from '@dwidge/hooks-react';
    import { View, Image } from 'react-native';

    function AnnotatedImageComponent() {
      const [doodleUri, setDoodleUri] = useAsyncState<DataUri | null>(null);
      const backgroundImage = "data:image/jpeg;base64,..."; // Your base64 encoded image

      return (
        <View>
          <DoodlePad
            doodleUri={[doodleUri, setDoodleUri]}
            backgroundUri={backgroundImage}
            backgroundColor="#f0f0f0" // Optional background color
          />
          {doodleUri && (
            <Image source={{ uri: doodleUri }} style={{ width: 200, height: 100 }} />
          )}
        </View>
      );
    }
    ```

5.  **Customizing Size:**

    ```typescript jsx
    <DoodlePad doodleUri={[doodleUri, setDoodleUri]} height={150} width={400} />
    ```

### 4.3. Internal Mechanism

- **WebView and HTML Canvas:** The core of the `DoodlePad` is a WebView that loads a simple HTML page (`doodlePadHTML`). This HTML page contains a `<canvas>` element and JavaScript code to handle drawing. This architecture ensures cross-platform compatibility as WebView and Canvas APIs are available on both native mobile platforms and web browsers.
- **Drawing Logic (JavaScript in WebView):**
  - The HTML page includes JavaScript that sets up event listeners for mouse and touch events on the canvas (`touchstart`, `touchmove`, `touchend`, `mousedown`, `mousemove`, `mouseup`, `mouseleave`).
  - Drawing is performed using the Canvas 2D API. Strokes are drawn as paths of connected lines based on user interactions.
  - A drawing history (`history` array) is maintained to implement the "Undo" functionality. Each stroke (path) is saved in the history as an array of points with color information.
  - `clearCanvas()` clears the canvas, removes any loaded doodle image, resets the history, and recalculates canvas dimensions based on the background image (if any).
  - `undoCanvas()` removes the last stroke from the history and redraws the entire canvas based on the remaining history.
  - `redrawCanvas()` redraws the entire canvas from the drawing history and the currently loaded doodle image (if any).
  - `saveCanvas()` gets the Data URI of the canvas content using `canvas.toDataURL('image/png')` and sends it back to the React Native/Web side via `window.ReactNativeWebView.postMessage()`.
  - Color selection is handled by setting `ctx.strokeStyle` and updating the `currentColor` variable when a color swatch is clicked in the palette. The selected color is also visually indicated in the palette.
  - Background image loading and canvas resizing are handled by the `handleBackgroundImage` function in the WebView, which dynamically creates and manages an `<img>` element for the background. Canvas dimensions are adjusted based on provided `width`, `height`, and the background image's aspect ratio using `setCanvasDimensions` and `getScaledDimensions` functions.
  - Doodle image loading is handled by `loadDoodleImage` which loads a provided doodle Data URI as an `<img>` element and redraws it onto the canvas as a base layer.
- **Communication between React Native/Web and WebView:**
  - **Message Passing:** Communication between the React Native/Web component and the WebView is done using `postMessage` (from WebView to React Native/Web) and `injectJavaScript` (from React Native/Web to WebView). Messages are stringified JSON objects.
  - **Initialization:** When the modal becomes visible and the WebView is ready, an 'init' message is sent from React Native to the WebView via `postMessage`. This message contains the `width`, `height`, `backgroundUri`, `doodleUri`, `maximize`, `isEditable`, `colorPalette`, and `selectedColor` props, initializing the WebView's state and UI.
  - **Saving Data URI:** When the "Save" button is pressed, `injectJavaScript('saveCanvas();')` is called to execute the `saveCanvas()` function in the WebView. This function sends the Data URI back to the React Native/Web side via `postMessage` with the source `webview-canvas`.
  - **Logging:** The WebView includes a `log` function that sends console log messages back to the React Native side via `postMessage` with the source `webview-log`. This is useful for debugging WebView-side code.
  - **Clearing and Undoing:** Similarly, `injectJavaScript('clearCanvas();')` and `injectJavaScript('undoCanvas();')` are used to trigger canvas clearing and undo operations from the React Native/Web side.
- **Modal and TouchableOpacity:** The modal provides a contained space for the doodle editor UI. The `TouchableOpacity` acts as a trigger to open the modal for editing and also as a preview area for the doodle when the modal is closed, displaying a `CompositeImage` of the background and doodle if available.

### 5. Conclusion

The `DoodlePad` component provides a solid foundation for adding drawing and annotation capabilities to applications. The proposed features will significantly enhance its utility, especially in scenarios requiring image annotation and more structured drawing. By leveraging WebView and HTML Canvas, it ensures broad platform compatibility and a relatively straightforward development process. Future development should prioritize the shape tools, text tool, eraser, and stroke width control to address the immediate needs for annotation use cases. The more complex JSON overlay for annotation saving can be considered as a longer-term goal for advanced use cases.
