import { prioritySelect } from "@dwidge/utils-js";
import * as assert from "assert";
import {
  CameraType,
  useCameraPermissions,
  CameraView,
  CameraRatio,
} from "expo-camera";
import React, { ReactNode, useEffect, useRef, useState } from "react";

// Fallback default
const defaultRatio = "16:9";

export const UnstyledCamera = ({
  children,
  debug,
}: {
  children?: (props: { switchCamera?: () => unknown }) => ReactNode;
  debug?: boolean;
}): React.JSX.Element | null => {
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const [ready, setReady] = useState(false);
  const [type, setType] = useState<CameraType>("back");
  const [types, setTypes] = useState<CameraType[]>(["back", "front"]);

  useEffect(() => {
    return () => {
      debug && console.log("UnstyledCamera1: Unmounted");
    };
  }, []);

  useEffect(() => {
    if (permission?.granted === undefined) {
      requestPermission();
    }
  }, [permission]);

  useEffect(() => {
    const fetchCameraData = async () => {
      if (!ready || !cameraRef.current) return;

      // Set static types (front/back)
      setTypes(["back", "front"]);
    };

    fetchCameraData();
  }, [ready]);

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

  const ratio = bestAspectRatio([defaultRatio]) as CameraRatio;
  const aspectRatio = ratio ? calcAspectRatio(ratio) : undefined;

  return permission?.granted ? (
    <CameraView
      style={{
        aspectRatio,
      }}
      facing={type}
      ratio={ratio}
      onCameraReady={() => setReady(true)}
    >
      {children?.({ switchCamera })}
    </CameraView>
  ) : null;
};

const bestAspectRatio = (ratios: CameraRatio[]) =>
  prioritySelect(["16:9", "1:2", "4:3", "1:1"])(ratios);

const calcAspectRatio = (ratio: CameraRatio, [w, h] = ratio?.split(":")) =>
  h && w ? +h / +w : undefined;
