// Copyright DWJ 2024.
// Distributed under the Boost Software License, Version 1.0.
// https://www.boost.org/LICENSE_1_0.txt

import { OptionalState } from "@dwidge/hooks-react";

/**
 * Represents the data structure for GPS information.
 * @typedef {Object} GpsData
 * @property {Object} coords - The geographic coordinates.
 * @property {number} coords.latitude - The latitude of the location.
 * @property {number} coords.longitude - The longitude of the location.
 * @property {number|null} coords.altitude - The altitude of the location (null if unavailable).
 * @property {number|null} coords.accuracy - The accuracy of the location data (null if unavailable).
 * @property {number|null} coords.heading - The heading of the device (null if unavailable).
 * @property {number|null} coords.speed - The speed of the device (null if unavailable).
 * @property {number} timestamp - The timestamp of when the GPS data was recorded.
 */
export type GpsData = {
  coords: {
    latitude: number;
    longitude: number;
    altitude: number | null;
    accuracy: number | null;
    heading: number | null;
    speed: number | null;
  };
  timestamp: number;
};

/**
 * A functional component that renders the GPS control interface.
 * @param {Object} props - The props for the component.
 * @param {OptionalState<GpsData | null>} [props.data] - The GPS data to display.
 * @param {Object} [props.options] - Additional options for the component.
 * @returns {React.JSX.Element} The rendered component.
 */
export type GpsControlComponent = ({
  data,
  options,
}: {
  data?: OptionalState<GpsData | null>;
  options?: {};
}) => React.JSX.Element;
