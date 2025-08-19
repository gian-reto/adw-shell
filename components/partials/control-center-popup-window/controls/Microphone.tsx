import Wireplumber from "gi://AstalWp";
import { createBinding, createComputed } from "ags";
import {
  ToggleButton,
  type ToggleButtonProps,
} from "../../../atoms/toggle-button/ToggleButton";

export type MicrophoneToggleProps = Omit<
  ToggleButtonProps,
  "iconName" | "isActive" | "isExpandable" | "label" | "onClicked"
>;

export const MicrophoneToggle = (props: MicrophoneToggleProps) => {
  // Constants
  const wireplumber = Wireplumber.get_default();

  // State
  const isMuted = createBinding(wireplumber.defaultMicrophone, "mute");
  const iconName = createComputed([isMuted], (value) =>
    value
      ? "microphone-disabled-symbolic"
      : "microphone-sensitivity-high-symbolic",
  );
  const label = createComputed([isMuted], (value) =>
    value ? "Muted" : "Unmuted",
  );

  return (
    <ToggleButton
      iconName={iconName}
      isActive={!isMuted}
      isExpandable={false}
      label={label}
      onClicked={() => {
        if (wireplumber) {
          wireplumber.defaultMicrophone.set_mute(
            !wireplumber.defaultMicrophone.mute,
          );
        }
      }}
      {...props}
    />
  );
};
