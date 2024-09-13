// Copyright DWJ 2024.
// Distributed under the Boost Software License, Version 1.0.
// https://www.boost.org/LICENSE_1_0.txt

import React from "react";
import { useNavigation } from "@dwidge/hooks-expo";
import { StyledText } from "@dwidge/components-rnw";
import { IconButtonProps, IconButton } from "@dwidge/components-rnw";
import { AlignedView } from "@dwidge/components-rnw";
import { Gap } from "@dwidge/components-rnw";

export const StyledHeader = ({
  title = "",
  actions = Array<IconButtonProps | false>(),
  back = useNavigation().up as (() => void) | undefined,
}) => (
  <AlignedView
    left={back && <IconButton icon="arrow-back" onPress={back} />}
    center={
      <StyledText center bold uppercase>
        {title}
      </StyledText>
    }
    right={
      actions
        ?.filter((a): a is IconButtonProps => !!a)
        .map((a) => <IconButton key={a.icon} {...a} />) ?? <Gap />
    }
  />
);
