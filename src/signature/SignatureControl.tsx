// Copyright DWJ 2024.
// Distributed under the Boost Software License, Version 1.0.
// https://www.boost.org/LICENSE_1_0.txt

import { StyledButton, StyledLoader, StyledView } from "@dwidge/components-rnw";
import { ErrorFallback } from "@dwidge/fallback-rnw";
import { asDataUri, useFileUri1 } from "@dwidge/file-cache-expo";
import { useOptionalState } from "@dwidge/hooks-react";
import { useContext } from "react";
import ErrorBoundary from "react-native-error-boundary";
import { FileApiContext } from "../file";
import { StyledDate } from "../StyledDate";
import { useAxios } from "../useAxios";
import { optional } from "../utils/optional";
import { SignaturePad } from "./SignaturePad";
import { SignatureComponent, SignatureData } from "./SignatureType";

export const SignatureControl: SignatureComponent = (props) => (
  <SignatureControlInternal {...props} />
);

const SignatureControlInternal = ({
  data: [data, setData] = useOptionalState<SignatureData | null>(null),
  options = {},
  file: [file, setFile] = useContext(FileApiContext)(
    data?.id
      ? {
          id: data.id,
          getUrl: undefined,
          putUrl: undefined,
          size: undefined,
          mime: undefined,
        }
      : data === null
        ? null
        : undefined,
  ),
}) => (
  <ErrorBoundary FallbackComponent={ErrorFallback}>
    <SignatureEdit
      file={[
        data?.id ? file : null,
        setFile && setData && file !== undefined
          ? async (dataPrev) => {
              const dataNext = await (typeof dataPrev === "function"
                ? dataPrev(file)
                : dataPrev);
              return setFile(dataNext).then(
                (keyPrev, keyNext = keyPrev) => (
                  setData(
                    keyNext && dataNext
                      ? {
                          id: keyNext.id,
                          size: dataNext.size,
                          mime: dataNext.mime,
                          timestamp: new Date().getTime(),
                        }
                      : null,
                  ),
                  keyNext
                ),
              );
            }
          : undefined,
      ]}
      onPressCreate={
        setFile &&
        setData &&
        (() =>
          setFile({}).then(
            (keyPrev, keyNext = keyPrev) => (
              keyNext && setData(keyNext),
              keyNext
            ),
          ))
      }
      onPressDelete={
        setFile && setData && (() => setFile(null).then(() => setData(null)))
      }
    />
  </ErrorBoundary>
);

const SignatureEdit = ({
  file: [file, setFile] = useContext(FileApiContext)(),
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
}): React.JSX.Element => (
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
      </StyledView>
    ) : (
      <StyledView flex column sgap overflowHidden>
        <StyledView row space sgap>
          {file.createdAt != null && (
            <StyledDate>{file.createdAt * 1000}</StyledDate>
          )}
          {onPressDelete && (
            <StyledButton
              onPress={onPressDelete}
              loading={isUploading}
              icon="trash-bin"
            />
          )}
        </StyledView>
        <SignaturePad
          dataUri={[
            fileUri != null ? asDataUri(fileUri) : fileUri,
            setFileUri &&
              ((uri) =>
                setFileUri(
                  typeof uri === "function"
                    ? uri(fileUri ?? null)
                    : (uri ?? null),
                  "image/png",
                )),
          ]}
        />
      </StyledView>
    )}
  </StyledView>
);
