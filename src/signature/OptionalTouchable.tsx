import { TouchableOpacity } from "react-native";

export const OptionalTouchable = ({
  onPress,
  children,
}: {
  onPress?: () => unknown;
  children: React.ReactNode;
}) =>
  onPress ? (
    <TouchableOpacity onPress={onPress}>{children}</TouchableOpacity>
  ) : (
    <>{children}</>
  );
