// Copyright DWJ 2024.
// Distributed under the Boost Software License, Version 1.0.
// https://www.boost.org/LICENSE_1_0.txt

import {
  StyledButton,
  StyledLoader,
  StyledText,
  StyledView,
} from "@dwidge/components-rnw";
import { exportUri } from "./exportUri";
import { FilePreview } from "./FilePreview";
import { getMediaFromCamera } from "./getMediaFromLibrary";
import { pickDocument } from "./pickDocument";
import { StyledDate } from "./StyledDate";
import { getMimeFromUri, getUriFromDoc } from "./uri";
import { UseFile2 } from "./UseFile2";
import { useFileUri } from "./useFileUri";

/**
 * React Native Expo component that allows viewing, updating, and downloading an uploaded file.
 *
 * - Any file type is allowed. You need to provide the correct MIME type according to the original file name's extension.
 * - When you upload or update the file, you first call `setFile` with the new MIME type, SHA-256 hash, and size properties.
 * - The file will then be updated with these properties, and `putUrl` will be a signed URL to upload the file to S3.
 * - `getUrl` will also be updated to a signed URL to load the file. Before using the `putUrl`, the `getUrl` will return 404.
 * - After uploading, refresh whatever uses the `getUrl`.
 *
 * @component
 * @param {Object} props - Component properties.
 * @param {string} [props.id] - The ID of the file.
 * @param {Array} props.file - The file state, including a getter and setter.
 * @param {Object} props.file[0] - The file object.
 * @param {Function} props.file[1] - The setter function to update the file object.
 */

export const FileEdit = ({
  file: [file, setFile] = [undefined, undefined] as UseFile2,
  fileUri: [fileUri, setFileUri, isUploading] = useFileUri([file, setFile]),
}): JSX.Element => {
  const handlePickFile = setFileUri
    ? async () => {
        const doc = await pickDocument();
        if (doc) await setFileUri(getUriFromDoc(doc), doc?.mime);
      }
    : undefined;

  const handlePickMedia = setFileUri
    ? async () => {
        const image = (await getMediaFromCamera())[0];
        if (image) await setFileUri(image?.uri, image.mimeType ?? "");
      }
    : undefined;

  const handleDownloadFile = fileUri
    ? () =>
        exportUri(fileUri, getMimeFromUri(fileUri)?.replace("/", ".") ?? "file")
    : undefined;

  return (
    <StyledView flex card column>
      {file ? (
        <StyledView flex column gap overflowHidden>
          <StyledView flex row gap wrap>
            <StyledView center middle mediumSquare outline overflowHidden>
              <FilePreview dataUri={fileUri} />
            </StyledView>
            <StyledView flex3 sgap minWidth>
              {file.createdBy != null && (
                <StyledText>Author: {file.createdBy}</StyledText>
              )}
              {file.createdAt != null && (
                <StyledDate>{file.createdAt * 1000}</StyledDate>
              )}
              {file.size != null && (
                <StyledText>{(file.size / 1024) | 0} KB</StyledText>
              )}
              {file.mime != null && <StyledText>{file.mime}</StyledText>}
            </StyledView>
          </StyledView>
          <StyledView sgap row>
            <StyledButton
              containerStyle={{ flex: 1 }}
              title="Export"
              onPress={handleDownloadFile}
            />
            <StyledButton
              containerStyle={{ flex: 1 }}
              title="Import"
              onPress={handlePickFile}
              loading={isUploading}
            />
            <StyledButton
              containerStyle={{ flex: 1 }}
              title="Camera"
              onPress={handlePickMedia}
              loading={isUploading}
            />
          </StyledView>
        </StyledView>
      ) : (
        <StyledLoader />
      )}
    </StyledView>
  );
};
