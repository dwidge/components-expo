import {
  ConfirmButton,
  Gap,
  StyledButton,
  StyledLoader,
  StyledText,
  StyledView,
} from "@dwidge/components-rnw";
import { ApiGetListHook, ApiSetList, asId } from "@dwidge/crud-api-react";
import {
  DataUri,
  Disabled,
  FileId,
  FileRecord,
  getDataUriFromBufferBin,
  getMetaOrNullFromDataUriOrNull,
  MetaNull,
} from "@dwidge/file-cache-expo";
import { AsyncState, useAsync } from "@dwidge/hooks-react";
import { Buffer } from "buffer";
import { StyledNotFound } from "./StyledNotFound.js";

export type FileCacheViewContext = {
  delFileList?: ApiSetList<FileRecord, { id: string }>;
  setFileList?: ApiSetList<FileRecord, { id: string }>;
  useFileList: ApiGetListHook<FileRecord>;
  useFileUri: (
    fileId: FileId | Disabled,
  ) => AsyncState<DataUri | null> | Disabled;
};

export const FileCacheListView = ({
  context,
}: {
  context: FileCacheViewContext;
}) => {
  const create = context.setFileList;
  const list = context.useFileList({});

  return (
    <StyledView flex gap>
      {list ? (
        list.map((v) => (
          <FileCacheItemView key={v.id} id={v.id} context={context} />
        ))
      ) : (
        <StyledLoader />
      )}
      <StyledButton onPress={create ? () => create([{}]) : undefined}>
        Create
      </StyledButton>
    </StyledView>
  );
};

export const FileCacheItemView = ({
  id,
  context,
}: {
  id: string | Disabled;
  context: FileCacheViewContext;
}) => {
  const [fileUri, setFileUri] = context.useFileUri(id) ?? [];
  const file = context.useFileList(asId(id))?.[0];
  const delFiles = context.delFileList;
  const [, , , cacheMeta] = useAsync(
    getMetaOrNullFromDataUriOrNull,
    fileUri === undefined ? undefined : [fileUri],
  );

  if (file === undefined) return <StyledLoader />;
  return file ? (
    <StyledView darker rounded pad gap>
      <StyledView row sgap wrap>
        <StyledText>{id}</StyledText>
        <Gap flex />
        <ConfirmButton
          confirm={!!fileUri}
          onPress={
            setFileUri
              ? () =>
                  setFileUri(
                    getDataUriFromBufferBin({
                      buffer: Buffer.from("hello" + Math.random()),
                      mime: "text/plain",
                    }),
                  )
              : undefined
          }
        >
          Random
        </ConfirmButton>
        <ConfirmButton
          confirm={!!fileUri}
          onPress={fileUri && setFileUri ? () => setFileUri(null) : undefined}
        >
          Null
        </ConfirmButton>
        <ConfirmButton
          confirm={!!fileUri}
          icon="trash-bin"
          onPress={delFiles ? () => delFiles([{ id }]) : undefined}
        />
      </StyledView>
      {file && cacheMeta ? (
        <StyledView row gap>
          <MetaView name="Database" file={file} compare={cacheMeta} />
          <MetaView name="File" file={cacheMeta} compare={file} />
        </StyledView>
      ) : (
        <StyledLoader />
      )}
    </StyledView>
  ) : (
    <StyledNotFound />
  );
};

const MetaView = ({
  name,
  file,
  compare,
}: {
  name: string;
  file: MetaNull;
  compare: MetaNull;
}) => (
  <StyledView
    flex
    gap
    pad
    outline
    style={file?.mime ? { backgroundColor: "#ff02" } : {}}
  >
    <StyledText bold>{name}</StyledText>
    <StyledText style={getCompareHighlight(file.size, compare.size)}>
      Size: {file.size}
    </StyledText>
    <StyledText style={getCompareHighlight(file.mime, compare.mime)}>
      Mime: {file.mime}
    </StyledText>
    <StyledText style={getCompareHighlight(file.sha256, compare.sha256)}>
      SHA256: {file.sha256}
    </StyledText>
  </StyledView>
);

const getCompareHighlight = <T,>(a: T | null, b: T | null) =>
  a === b || a === null || b === null ? {} : { backgroundColor: "#f002" };
