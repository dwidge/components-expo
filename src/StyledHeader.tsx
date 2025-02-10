// Copyright DWJ 2024.
// Distributed under the Boost Software License, Version 1.0.
// https://www.boost.org/LICENSE_1_0.txt

import {
  AlignedView,
  IconButton,
  StyledText,
  StyledView,
} from "@dwidge/components-rnw";
import { useNavigation } from "@dwidge/hooks-expo";
import { Fragment, ReactNode } from "react";
import { StyleProp, ViewStyle } from "react-native";

export const StyledHeader = ({
  title = "",
  actions = Array<ReactNode>(),
  back = useNavigation().up as (() => void) | undefined,
  style = undefined as StyleProp<ViewStyle> | undefined,
}) => (
  <AlignedView
    left={back && <IconButton icon="arrow-back" onPress={back} style={style} />}
    center={
      <StyledText center bold uppercase>
        {title}
      </StyledText>
    }
    right={
      <StyledView pad row gap>
        {actions?.map((a, i) => <Fragment key={i}>{a}</Fragment>)}
      </StyledView>
    }
  />
);
export type StyledHeaderProps = Parameters<typeof StyledHeader>[0];
