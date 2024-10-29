// Copyright DWJ 2024.
// Distributed under the Boost Software License, Version 1.0.
// https://www.boost.org/LICENSE_1_0.txt

import { State } from "../utils/State.js";

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

export type GpsControlComponent = ({
  data,
  options,
}: {
  data?: State<GpsData | null | undefined> | undefined;
  options?: {};
}) => React.JSX.Element;
