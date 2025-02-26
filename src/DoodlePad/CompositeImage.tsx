import { DataUri } from "@dwidge/file-cache-expo";
import { Image } from "expo-image";
import React from "react";
import { StyleProp, StyleSheet, View, ViewStyle } from "react-native";

/**
 * Properties for the {@link CompositeImage} component.
 *
 * @interface CompositeImageProps
 */
interface CompositeImageProps {
  /**
   * An array of DataUris representing the images to be composited.
   * Images are stacked in the order they appear in the array, with the first image at the bottom and the last image on top.
   * Null values are permitted in the array and will be ignored, resulting in no image being rendered for that position.
   *
   * @type {(DataUri | null)[]}
   */
  images?: (DataUri | null)[];
  /**
   * Optional style to apply to the container View of the composite image.
   * This style will be merged with the default container styles.
   *
   * @type {StyleProp<ViewStyle>}
   */
  style?: StyleProp<ViewStyle>;
}

/**
 * A component that layers multiple images on top of each other.
 * It uses absolute positioning to stack images provided as DataUris.
 *
 * @component
 * @param {CompositeImageProps} props - The properties for the CompositeImage component.
 * @returns {React.ReactElement} A View containing the composited images.
 *
 * @example
 * ```tsx
 * import { CompositeImage } from '@dwidge/components-expo';
 * import { DataUri } from "@dwidge/file-cache-expo";
 * import React from 'react';
 * import { View } from 'react-native';
 *
 * const image1: DataUri = 'data:image/png;base64,...'; // Replace with actual DataUri
 * const image2: DataUri = 'data:image/png;base64,...'; // Replace with actual DataUri
 *
 * export const ExampleComponent = () => {
 *   return (
 *     <View style={{ width: 200, height: 200 }}>
 *       <CompositeImage images={[image1, image2]} />
 *     </View>
 *   );
 * };
 * ```
 */
export const CompositeImage: React.FC<CompositeImageProps> = ({
  images,
  style,
}) => {
  return (
    <View style={[styles.container, style]}>
      {/* Apply container styles and the passed style */}
      {images?.map((imageSource, index) => (
        <Image
          key={index} // Use index as key for simplicity, consider a more stable key if images are reordered
          style={styles.image}
          source={imageSource}
          contentFit="contain" // Or make configurable if needed
          transition={500}
        />
      ))}
    </View>
  );
};

/**
 * Style definitions for the CompositeImage component.
 */
const styles = StyleSheet.create({
  container: {
    position: "relative", // To contain absolute positioned images
    width: "100%",
    height: "100%", // Or adjust as needed
  },
  image: {
    position: "absolute", // Stack images on top of each other
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    resizeMode: "contain", // Or 'cover', 'stretch', etc. - make configurable if needed
  },
});
