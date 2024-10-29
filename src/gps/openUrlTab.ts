// Copyright DWJ 2024.
// Distributed under the Boost Software License, Version 1.0.
// https://www.boost.org/LICENSE_1_0.txt

import { Platform } from "react-native";
import * as Linking from "expo-linking";

export const openUrlTab = (url: string) =>
  Platform.OS === "web" ? window.open(url, "_blank") : Linking.openURL(url);
