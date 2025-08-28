import { StyledButton, StyledButtonProps } from "@dwidge/components-rnw";
import { useNav } from "@dwidge/hooks-expo";

export interface StyledNavButtonProps extends StyledButtonProps {
  nav?: string;
  params?: Record<string, string | number | undefined>;
}

export const StyledNavButton = ({
  nav,
  params,
  ...props
}: StyledNavButtonProps) => {
  const navigate = useNav();
  return (
    <StyledButton
      onPress={nav ? () => navigate(nav, params) : undefined}
      {...props}
    />
  );
};
