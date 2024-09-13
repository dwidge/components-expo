// Copyright DWJ 2024.
// Distributed under the Boost Software License, Version 1.0.
// https://www.boost.org/LICENSE_1_0.txt

import Axios, { AxiosInstance } from "axios";
import React, { createContext, useContext } from "react";

const AxiosContext = createContext<AxiosInstance | null>(null);

export const AxiosProvider = ({
  children,
  axios = Axios.create(),
}: {
  children: React.ReactNode;
  axios?: AxiosInstance;
}) => <AxiosContext.Provider value={axios}>{children}</AxiosContext.Provider>;

export const useAxios = (): AxiosInstance =>
  useContext(AxiosContext) ?? Axios.create();
