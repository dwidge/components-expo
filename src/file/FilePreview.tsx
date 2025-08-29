// Copyright DWJ 2024.
// Distributed under the Boost Software License, Version 1.0.
// https://www.boost.org/LICENSE_1_0.txt

import {
  CenterView,
  getFontAwesomeGlyphFromMime,
  StyledFontAwesome,
  StyledLoader,
} from "@dwidge/components-rnw";
import { asDataUri, getMimeTypeFromDataUri } from "@dwidge/file-cache-expo";
import { useBufferedState } from "@dwidge/hooks-react";
import { Image } from "@rneui/themed";
import { exportDataUri } from "../exportDataUri";

const useDataUriCache = (dataUri: string | null | undefined) =>
  useBufferedState<string | null | undefined>([dataUri, () => {}]);

export const FilePreview = ({
  dataUri = undefined as string | null | undefined,
  dataUriCache: [dataUriCache, setDataUriCache] = useDataUriCache(dataUri),
  name = undefined as string | null | undefined,
}): React.JSX.Element =>
  dataUriCache === "" ? (
    <CenterView overflowHidden>
      <StyledFontAwesome name={"warning"} />
    </CenterView>
  ) : dataUriCache === undefined ? (
    <CenterView overflowHidden>
      <StyledLoader />
    </CenterView>
  ) : dataUriCache === null ? (
    <CenterView overflowHidden>
      <StyledFontAwesome name={"upload"} />
    </CenterView>
  ) : getMimeTypeFromDataUri(asDataUri(dataUriCache)).includes("image") ? (
    <Image
      containerStyle={{ flex: 1 }}
      style={{
        flex: 1,
        resizeMode: "contain",
      }}
      source={{ uri: dataUriCache }}
      onError={(e) => (
        console.log("FilePreviewE1", e.nativeEvent.error),
        setDataUriCache?.(() => "")
      )}
      onPress={
        dataUriCache
          ? () => exportDataUri(dataUriCache, name ?? undefined)
          : undefined
      }
    />
  ) : (
    <CenterView overflowHidden>
      <StyledFontAwesome
        name={getFontAwesomeGlyphFromMime(
          getMimeTypeFromDataUri(asDataUri(dataUriCache)),
        )}
        onPress={
          dataUriCache
            ? () => exportDataUri(dataUriCache, name ?? undefined)
            : undefined
        }
      />
    </CenterView>
  );
