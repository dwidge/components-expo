// Copyright DWJ 2024.
// Distributed under the Boost Software License, Version 1.0.
// https://www.boost.org/LICENSE_1_0.txt

import { useState } from "react";
import { State } from "./State";

export const useStateWithOptionalSetter = <T>(initialState: T): State<T> =>
  useState<T>(initialState) as State<T>;
