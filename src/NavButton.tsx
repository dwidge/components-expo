import { StyledButton } from "@dwidge/components-rnw";
import { useNav } from "@dwidge/hooks-expo";

export const NavButton = ({ route = "", title = "", nav = useNav() }) => (
  <StyledButton onPress={() => nav(route)}>{title}</StyledButton>
);
