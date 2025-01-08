import { StyledButton } from "@dwidge/components-rnw";
import { useNav } from "@dwidge/hooks-expo";

export const NavButton = ({
  route = "",
  title = "",
  icon = "",
  nav = useNav(),
}) => (
  <StyledButton icon={icon as any} onPress={() => nav(route)}>
    {title}
  </StyledButton>
);
