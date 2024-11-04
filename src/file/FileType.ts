// Copyright DWJ 2024.
// Distributed under the Boost Software License, Version 1.0.
// https://www.boost.org/LICENSE_1_0.txt

import { AsyncState, OptionalState } from "@dwidge/hooks-react";

export type FileData = {
  id?: string;
  size?: number | null;
  mime?: string | null;
};

export type FileComponent = ({
  data,
  options,
}: {
  data?: OptionalState<FileData | null>;
  options?: {
    mime?: { enum?: string[] };
    size?: { maximum?: number };
  };
}) => React.JSX.Element;

export type File2Key = {
  id?: string;
};
export type File2Get = {
  id?: string | undefined;
  created?: boolean | undefined;
  createdAt?: number | undefined;
  createdBy?: number | null | undefined;
  size?: number | null | undefined;
  mime?: string | null | undefined;
  sha256?: string | null | undefined;
  getUrl?: string | null | undefined;
  putUrl?: string | null | undefined;
};
export type File2Set = {
  id?: string | undefined;
  CompanyId?: number | null | undefined;
  created?: boolean | undefined;
  size?: number | null | undefined;
  mime?: string | null | undefined;
  sha256?: string | null | undefined;
};
export type File2Result = File2Key | null;
export type UseFile2 = AsyncState<File2Get | null>;
