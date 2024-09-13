// Copyright DWJ 2024.
// Distributed under the Boost Software License, Version 1.0.
// https://www.boost.org/LICENSE_1_0.txt

import { ReactNode, useState } from "react";
import { Audio } from "expo-av";

export const UnstyledMic = ({
  children,
  debug,
}: {
  children?: (props: {
    startRecording: () => unknown;
    stopRecording: () => unknown;
    startPlaying: () => unknown;
    stopPlaying: () => unknown;
    isRecording: boolean;
    isPlaying: boolean;
    recordingUri: string | null;
  }) => ReactNode;
  debug?: boolean;
}) => {
  const [recording, setRecording] = useState<Audio.Recording>();
  const [sound, setSound] = useState<Audio.Sound>();
  const [recordingUri, setRecordingUri] = useState<string | null>(null);
  const [permissionResponse, requestPermission] = Audio.usePermissions();

  async function startRecording() {
    if (permissionResponse?.status !== "granted") {
      if (debug) console.log("Requesting permission..");
      await requestPermission();
    }
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
    });

    if (debug) console.log("Starting recording..");
    const { recording } = await Audio.Recording.createAsync(
      Audio.RecordingOptionsPresets.HIGH_QUALITY
    );
    setRecording(recording);
    if (debug) console.log("Recording started");
  }

  async function stopRecording() {
    if (!recording) return;
    if (debug) console.log("Stopping recording..");
    setRecording(undefined);
    await recording.stopAndUnloadAsync();
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
    });
    const uri = recording.getURI();
    setRecordingUri(uri);
    if (debug) console.log("Recording stopped and stored at", uri);
  }

  async function startPlaying() {
    if (!recordingUri) return;
    const { sound } = await Audio.Sound.createAsync({ uri: recordingUri });
    setSound(sound);

    sound.setOnPlaybackStatusUpdate((status) => {
      if (status.isLoaded && status.didJustFinish) {
        if (debug) console.log("didJustFinish1", status);
        stopPlaying();
      }
    });

    await sound.playAsync();
  }

  async function stopPlaying() {
    setSound((sound) => {
      if (sound) sound.stopAsync().then(() => sound.unloadAsync());
      return undefined;
    });
  }

  return children?.({
    startRecording,
    stopRecording,
    startPlaying,
    stopPlaying,
    isRecording: !!recording,
    isPlaying: !!sound,
    recordingUri,
  });
};
