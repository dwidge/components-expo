// Copyright DWJ 2024.
// Distributed under the Boost Software License, Version 1.0.
// https://www.boost.org/LICENSE_1_0.txt

import {
  StyledButton,
  StyledLoader,
  StyledText,
  StyledView,
} from "@dwidge/components-rnw";
import {
  asDataUri,
  getDataUriFromDoc,
  getMimeTypeFromDataUri,
  useFileUri1,
} from "@dwidge/file-cache-expo";
import { useState } from "react";
import { Platform, TouchableOpacity } from "react-native";
import { exportUri } from "../exportUri.js";
import { getMediaFromCamera } from "../getMediaFromLibrary.js";
import { pickDocument } from "../pickDocument.js";
import { StyledDate } from "../StyledDate.js";
import { useAxios } from "../useAxios.js";
import { optional } from "../utils/optional.js";
import { FilePreview } from "./FilePreview.js";
import { FilePreviewModal } from "./FilePreviewModal.js";
import { File2Get, UseFile2 } from "./FileType.js";

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
  fileUri: [fileUri, setFileUri, isUploading] = useFileUri1(
    [file, setFile],
    useAxios(),
  ),
  onPressCreate = optional(
    async (): Promise<{ id?: string } | null | undefined> => {
      console.log("onPressCreate1");
      return undefined;
    },
  ),
  onPressDelete = optional(async () => {
    console.log("onPressDelete1");
  }),
  onPressOpen = setFileUri
    ? async () => {
        const doc = await pickDocument();
        if (doc) await setFileUri(getDataUriFromDoc(doc), doc?.mime);
      }
    : undefined,
  onPressCamera = Platform.OS !== "web" && setFileUri
    ? async () => {
        const image = (await getMediaFromCamera())[0];
        if (image) await setFileUri(image?.uri, image.mimeType ?? "");
      }
    : undefined,
  onPressSave = fileUri
    ? () =>
        exportUri(
          fileUri,
          getMimeTypeFromDataUri(asDataUri(fileUri))?.replace("/", ".") ??
            "file",
        )
    : undefined,
  isModalVisible: [isModalVisible, setModalVisible] = useState(false),
  onPressPreview = optional(async () => {
    setModalVisible(true);
  }),
}): JSX.Element => (
  <StyledView flex card column>
    {file === undefined ? (
      <StyledLoader />
    ) : file === null || !file.id ? (
      <StyledView sgap row>
        {onPressCreate && (
          <StyledButton
            containerStyle={{ flex: 1 }}
            onPress={() => onPressCreate()}
            loading={isUploading}
            icon="create"
          />
        )}
        {onPressCreate && onPressOpen && (
          <StyledButton
            containerStyle={{ flex: 1 }}
            onPress={() => onPressCreate().then(onPressOpen)}
            loading={isUploading}
            icon="folder-open"
          />
        )}
        {onPressCreate && onPressCamera && (
          <StyledButton
            containerStyle={{ flex: 1 }}
            onPress={() => onPressCreate().then(onPressCamera)}
            loading={isUploading}
            icon="camera"
          />
        )}
      </StyledView>
    ) : (
      <StyledView flex row gap overflowHidden>
        <StyledView flex row gap>
          <StyledView mediumSquare>
            <TouchableOpacity style={{ flex: 1 }} onPress={onPressPreview}>
              <FilePreview dataUri={fileUri} />
            </TouchableOpacity>
          </StyledView>
          <FileDetails file={file} />
        </StyledView>
        <StyledView sgap column>
          {onPressDelete && (
            <StyledButton
              containerStyle={{ flex: 1 }}
              onPress={onPressDelete}
              icon="trash-bin"
            />
          )}
          {onPressSave && (
            <StyledButton
              containerStyle={{ flex: 1 }}
              onPress={onPressSave}
              icon="save"
            />
          )}
          {onPressOpen && (
            <StyledButton
              containerStyle={{ flex: 1 }}
              onPress={onPressOpen}
              loading={isUploading}
              icon="folder-open"
            />
          )}
          {onPressCamera && (
            <StyledButton
              containerStyle={{ flex: 1 }}
              onPress={onPressCamera}
              loading={isUploading}
              icon="camera"
            />
          )}
        </StyledView>
      </StyledView>
    )}

    <FilePreviewModal
      visible={[isModalVisible, setModalVisible]}
      dataUri={fileUri}
    />
  </StyledView>
);

const FileDetails = ({ file = {} as File2Get }) => (
  <StyledView flex3 sgap>
    {/* {file.createdBy != null && (
      <StyledText>Author: {file.createdBy}</StyledText>
    )} */}
    {file.createdAt != null && <StyledDate>{file.createdAt * 1000}</StyledDate>}
    {file.size != null && <StyledText>{(file.size / 1024) | 0} KB</StyledText>}
    {file.mime != null && <StyledText>{file.mime}</StyledText>}
  </StyledView>
);
