import {
  ToggleButtonMenu,
  ToggleButtonMenuItemProps,
  ToggleButtonMenuProps,
} from "../../../atoms/toggle-button/ToggleButton";

import { Gtk } from "ags/gtk4";
import { cx } from "../../../../util/cx";
import { execAsync } from "ags/process";

export type PowerMenuProps = Omit<
  ToggleButtonMenuProps,
  "footer" | "iconName" | "title"
>;

export const PowerMenu = (props: PowerMenuProps) => {
  // Constants
  const items = [
    {
      label: "Suspend",
      onClicked: () => {
        execAsync(["systemctl", "suspend"]).catch((error: unknown) => {
          console.error("Failed to suspend the system", error);
        });
      },
    },
    {
      label: "Restart",
      onClicked: () => {
        execAsync(["systemctl", "reboot"]).catch((error: unknown) => {
          console.error("Failed to restart the system", error);
        });
      },
    },
    {
      label: "Power Off",
      onClicked: () => {
        execAsync(["shutdown", "now"]).catch((error: unknown) => {
          console.error("Failed to power off the system", error);
        });
      },
    },
  ];

  return (
    <ToggleButtonMenu
      footer={
        <PowerMenuItem
          label="Log Out"
          onClicked={() => {
            execAsync(["hyprctl", "dispatch", "exit"]).catch(
              (error: unknown) => {
                console.error("Failed to log out", error);
              }
            );
          }}
        />
      }
      iconName="system-shutdown-symbolic"
      title="Power Off"
      {...props}
    >
      <box hexpand orientation={Gtk.Orientation.VERTICAL}>
        {items.map(({ label, onClicked }) => (
          <PowerMenuItem label={label} onClicked={onClicked} />
        ))}
      </box>
    </ToggleButtonMenu>
  );
};

type PowerMenuItemProps = ToggleButtonMenuItemProps & {
  readonly label: string;
};

const PowerMenuItem = (props: PowerMenuItemProps) => {
  // Props
  const { class: classOverride, label, ...restProps } = props;

  return (
    <ToggleButtonMenu.Item
      class={cx("space-x-2", classOverride)}
      {...restProps}
    >
      <label
        label={label}
        halign={Gtk.Align.START}
        hexpand
        valign={Gtk.Align.CENTER}
        vexpand={false}
      />
    </ToggleButtonMenu.Item>
  );
};
