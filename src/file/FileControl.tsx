// Copyright DWJ 2024.
// Distributed under the Boost Software License, Version 1.0.
// https://www.boost.org/LICENSE_1_0.txt

import { StyledLoader } from "@dwidge/components-rnw";
import { useContext } from "react";
import { FileEdit } from "./FileEdit.js";
import { FileApiContext } from "./FileContext.js";
import { FileComponent, FileData } from "./FileType.js";
import { useStateWithOptionalSetter } from "../utils/useStateWithOptionalSetter.js";

export const FileControl: FileComponent = ({
  data = useStateWithOptionalSetter<FileData | null | undefined>(undefined),
  options,
}) => <FileControlInternal data={data} />;

const FileControlInternal = ({
  data: [data, setData] = useStateWithOptionalSetter<
    FileData | null | undefined
  >(undefined),
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
          setFile &&
            setData &&
            ((v) =>
              setFile(v).then(
                (key) => (
                  setData(
                    key && v
                      ? {
                          id: key.id,
                          size: v.size,
                          mime: v.mime,
                        }
                      : null,
                  ),
                  key
                ),
              )),
        ]}
        onPressCreate={
          setFile &&
          setData &&
          (() => setFile({}).then((key) => (key && setData(key), key)))
        }
        onPressDelete={
          setFile && setData && (() => setFile(null).then(() => setData(null)))
        }
      />
    </>
  );
