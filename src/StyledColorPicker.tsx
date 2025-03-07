import {
  CenterView,
  StyledButton,
  StyledModal,
  StyledView,
} from "@dwidge/components-rnw";
import ReanimatedColorPicker, {
  HueSlider,
  OpacitySlider,
  Panel1,
  Preview,
  Swatches,
} from "reanimated-color-picker";

export const StyledColorPicker = ({
  title = "Color",
  value = "#ffffffff",
  onChange = (v: string) => {},
}) => (
  <StyledModal>
    {(onOpen) => (
      <StyledButton icon="color-palette" title={title} onPress={onOpen} />
    )}
    {(onClose) => (
      <CenterView backgroundAlpha>
        <StyledView>
          <ReanimatedColorPicker
            value={value}
            onChange={(r) => onChange(r.hex)}
          >
            <Preview />
            <Panel1 />
            <HueSlider />
            <OpacitySlider />
            <Swatches />
          </ReanimatedColorPicker>
        </StyledView>
      </CenterView>
    )}
  </StyledModal>
);
