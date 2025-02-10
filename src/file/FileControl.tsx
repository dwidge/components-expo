// Copyright DWJ 2024.
// Distributed under the Boost Software License, Version 1.0.
// https://www.boost.org/LICENSE_1_0.txt

import { StyledLoader } from "@dwidge/components-rnw";
import { useOptionalState } from "@dwidge/hooks-react";
import { useContext } from "react";
import { FileApiContext } from "./FileContext.js";
import { FileEdit } from "./FileEdit.js";
import { FileComponent, FileData } from "./FileType.js";

export const FileControl: FileComponent = ({
  data = useOptionalState<FileData | null>(null),
  options,
}) => <FileControlInternal data={data} />;

const FileControlInternal = ({
  data: [data, setData] = useOptionalState<FileData | null>(null),
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
}) =>
  data === undefined ? (
    <StyledLoader />
  ) : (
    <>
      <FileEdit
        file={[
          data?.id ? file : null,
          setFile && setData
            ? async (dataPrev) => {
                const dataNext = await (typeof dataPrev === "function"
                  ? dataPrev({})
                  : dataPrev);
                return setFile(dataNext).then(
                  (keyPrev, keyNext = keyPrev) => (
                    setData(
                      keyNext && dataNext
                        ? {
                            id: keyNext.id,
                            size: dataNext.size,
                            mime: dataNext.mime,
                          }
                        : null,
                    ),
                    keyPrev
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
                keyNext && setData(keyNext), keyNext
              ),
            ))
        }
        onPressDelete={
          setFile && setData && (() => setFile(null).then(() => setData(null)))
        }
      />
    </>
  );
