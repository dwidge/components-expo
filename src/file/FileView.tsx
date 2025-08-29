// Copyright DWJ 2024.
// Distributed under the Boost Software License, Version 1.0.
// https://www.boost.org/LICENSE_1_0.txt

import { StyledLoader, StyledView } from "@dwidge/components-rnw";
import { useFileUri1 } from "@dwidge/file-cache-expo";
import { useAxios } from "../useAxios.js";
import { FilePreview } from "./FilePreview.js";
import { UseFile2 } from "./FileType.js";

export const FileView = ({
  file: [file, setFile] = [undefined, undefined] as UseFile2,
  fileUri: [fileUri] = useFileUri1([file, setFile], useAxios()),
}): React.JSX.Element =>
  file ? (
    <StyledView center middle mediumSquare outline overflowHidden>
      <FilePreview dataUri={fileUri} />
    </StyledView>
  ) : (
    <StyledLoader />
  );
