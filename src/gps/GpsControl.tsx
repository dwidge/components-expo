// Copyright DWJ 2024.
// Distributed under the Boost Software License, Version 1.0.
// https://www.boost.org/LICENSE_1_0.txt

import {
  StyledButton,
  StyledLoader,
  StyledText,
  StyledView,
} from "@dwidge/components-rnw";
import { useOptionalState } from "@dwidge/hooks-react";
import * as Location from "expo-location";
import { useState } from "react";
import { GpsControlComponent, GpsData } from "./GpsType.js";
import { openUrlTab } from "./openUrlTab.js";

/**
 * GpsControl is a functional component that displays the current GPS location and allows the user to capture their location.
 * @param {Object} props - The props for the component.
 * @param {OptionalState<GpsData | null>} [props.data] - The state of GPS data to display. Similar to: `const [data, setData] = useState<GpsData | null>(null);`
 * @param {Object} [props.options] - Additional options for the component.
 * @returns {React.JSX.Element} The rendered component.
 */
export const GpsControl: GpsControlComponent = ({
  data = useOptionalState<GpsData | null>(null),
  options,
}) => <GpsControlInternal data={data} />;

const GpsControlExample = () => {
  const [gpsData, setGpsData] = useState<GpsData | null>({
    coords: {
      latitude: 37.7749,
      longitude: -122.4194,
      altitude: null,
      accuracy: null,
      heading: null,
      speed: null,
    },
    timestamp: Date.now(),
  });

  return (
    <StyledView>
      <GpsControl data={[gpsData, setGpsData]} />
    </StyledView>
  );
};

/**
 * GpsControlInternal is a helper component that renders the internal UI for the GpsControl component.
 * @param {Object} param - The props for the component.
 * @param {OptionalState<GpsData | null>} param.data - The GPS data to display and a function to set it.
 * @returns {React.JSX.Element} The rendered component.
 */
const GpsControlInternal = ({
  data: [data, setData] = useOptionalState<GpsData | null>(null),
}) =>
  data === undefined ? (
    <StyledLoader />
  ) : (
    <StyledView column gap>
      {data ? (
        <StyledView column gap>
          <StyledView>
            <StyledText>Latitude: {data.coords.latitude}</StyledText>
            <StyledText>Longitude: {data.coords.longitude}</StyledText>
            <StyledText>Timestamp: {data.timestamp}</StyledText>
          </StyledView>
          <StyledView row gap>
            <StyledButton
              title="Google Maps"
              onPress={() =>
                openUrlTab(
                  `https://www.google.com/maps?q=${data.coords.latitude},${data.coords.longitude}`,
                )
              }
            />
            <StyledButton
              title="Bing Maps"
              onPress={() =>
                openUrlTab(
                  `https://www.bing.com/maps?q=${data.coords.latitude},${data.coords.longitude}`,
                )
              }
            />
          </StyledView>
        </StyledView>
      ) : (
        <>
          <StyledText>No GPS location captured</StyledText>
        </>
      )}
      {setData && (
        <StyledView flex gap row wrap>
          <StyledButton
            title="Capture Current Location"
            onPress={() => getLocation().then(setData)}
          />
          {!!data && (
            <StyledButton title="Clear" onPress={() => setData(null)} />
          )}
        </StyledView>
      )}
    </StyledView>
  );

/**
 * Asynchronously requests the current location of the device and returns the location data.
 * @returns {Promise<Object>} A promise that resolves to the current location data.
 * @throws Will throw an error if GPS permission is not granted.
 */
const getLocation = async () => {
  let { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== "granted") {
    throw new Error("getLocationE1: Could not get GPS permission");
  }

  let location = await Location.getCurrentPositionAsync({});
  return location;
};
