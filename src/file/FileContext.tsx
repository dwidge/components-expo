// Copyright DWJ 2024.
// Distributed under the Boost Software License, Version 1.0.
// https://www.boost.org/LICENSE_1_0.txt

import { createContext } from "react";
import { File2Get, UseFile2 } from "./FileType.js";

export const FileApiContext = createContext<
  (filter?: File2Get | null) => UseFile2
>(
  () => (
    console.warn(
      "FileApiContextW1: Please wrap App with <FileApiContext.Provider value={yourFileApiHook}></FileApiContext.Provider>",
    ),
    [undefined, undefined]
  ),
);
