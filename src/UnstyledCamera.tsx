// Copyright DWJ 2024.
// Distributed under the Boost Software License, Version 1.0.
// https://www.boost.org/LICENSE_1_0.txt

import { prioritySelect } from "@dwidge/utils-js";
import * as assert from "assert";
import { Camera, CameraType } from "expo-camera/legacy";
import { ReactNode, useEffect, useRef, useState } from "react";
import { Platform } from "react-native";

export const UnstyledCamera = ({
  children,
  debug,
}: {
  children?: (props: {
    switchCamera?: () => unknown;
    // takePicture: () => unknown;
    // startRecording: () => unknown;
    // stopRecording: () => unknown;
    // startPlaying: (mediaUri: string) => unknown;
    // stopPlaying: () => unknown;
    // isRecording: boolean;
    // isPlaying: boolean;
    // currentMediaUri: string | undefined;
    // mediaUri: string[];
  }) => ReactNode;
  debug?: boolean;
}): JSX.Element | null => {
  const [permission, requestPermission] = Camera.useCameraPermissions();
  const camera = useRef<Camera>(null);
  const [ready, setReady] = useState(false);
  const [type, setType] = useState<CameraType>(CameraType.back);
  const [types, setTypes] = useState<CameraType[]>([
    CameraType.back,
    CameraType.front,
  ]);
  const [ratios, setRatios] = useState<string[] | undefined>();

  useEffect(
    () => () => {
      debug && console.log("UnstyledCamera1: Unmounted");
    },
    []
  );

  useEffect(() => {
    if (permission?.granted === undefined) requestPermission();
  }, [permission]);

  useEffect(() => {
    if (camera.current && ready) {
      if (Platform.OS !== "web")
        camera.current.getSupportedRatiosAsync().then(setRatios);

      if (Platform.OS === "web")
        Camera.getAvailableCameraTypesAsync().then(setTypes);
    }
  }, [camera.current, ready]);

  const switchCamera =
    types.length < 2
      ? undefined
      : () =>
          setType((current) => {
            const nextIndex = (types.indexOf(current) + 1) % types.length;
            const nextType = types[nextIndex];
            assert.ok(nextType);
            return nextType;
          });

  const ratio = ratios && bestAspectRatio(ratios);
  const aspectRatio = ratio ? calcAspectRatio(ratio) : undefined;

  return permission?.granted ? (
    <Camera
      ref={camera}
      style={{
        aspectRatio,
      }}
      type={type}
      ratio={ratio}
      onCameraReady={() => setReady(true)}
    >
      {children?.({ switchCamera })}
    </Camera>
  ) : null;
};

const bestAspectRatio = (ratios: string[]) =>
  prioritySelect(["16:9", "1:2", "4:3", "1:1"])(ratios);

const calcAspectRatio = (ratio: string, [w, h] = ratio?.split(":")) =>
  h && w ? +h / +w : undefined;
