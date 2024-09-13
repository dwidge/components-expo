// Copyright DWJ 2024.
// Distributed under the Boost Software License, Version 1.0.
// https://www.boost.org/LICENSE_1_0.txt

import { SplashScreen } from "expo-router";
import { PropsWithChildren, useEffect } from "react";

export const SplashLoader = ({ children }: PropsWithChildren) => {
  useEffect(() => {
    defer3().then(SplashScreen.hideAsync);
  }, []);

  return children;
};

const defer = () => new Promise((r) => setTimeout(r, 1));
const defer3 = async () => {
  await defer();
  await defer();
  await defer();
};
