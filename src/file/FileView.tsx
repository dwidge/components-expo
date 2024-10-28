// Copyright DWJ 2024.
// Distributed under the Boost Software License, Version 1.0.
// https://www.boost.org/LICENSE_1_0.txt

import { StyledLoader, StyledView } from "@dwidge/components-rnw";
import { FilePreview } from "./FilePreview";
import { useFileUri } from "./useFileUri";
import { UseFile2 } from "./FileType";

export const FileView = ({
  file: [file, setFile] = [undefined, undefined] as UseFile2,
  fileUri: [fileUri] = useFileUri([file, setFile]),
}): JSX.Element =>
  file ? (
    <StyledView center middle mediumSquare outline overflowHidden>
      <FilePreview dataUri={fileUri} />
    </StyledView>
  ) : (
    <StyledLoader />
  );
