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
import { GpsControlComponent, GpsData } from "./GpsType.js";
import { openUrlTab } from "./openUrlTab.js";

export const GpsControl: GpsControlComponent = ({
  data = useOptionalState<GpsData | null>(null),
  options,
}) => <GpsControlInternal data={data} />;

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

const getLocation = async () => {
  let { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== "granted") {
    throw new Error("getLocationE1: Could not get GPS permission");
  }

  let location = await Location.getCurrentPositionAsync({});
  return location;
};
