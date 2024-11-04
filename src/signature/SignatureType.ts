// Copyright DWJ 2024.
// Distributed under the Boost Software License, Version 1.0.
// https://www.boost.org/LICENSE_1_0.txt

import { OptionalState } from "@dwidge/hooks-react";

export type SignatureData = {
  id?: string;
  size?: number | null;
  mime?: string | null;
  timestamp?: number;
};

export type SignatureOptions = {
  mime?: { enum?: string[] };
  size?: { maximum?: number };
};

export type SignatureComponent = (p: {
  data?: OptionalState<SignatureData | null>;
  options?: SignatureOptions;
}) => React.JSX.Element;
