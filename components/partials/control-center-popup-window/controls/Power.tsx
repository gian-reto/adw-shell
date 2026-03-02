import { Gtk } from "ags/gtk4";
import { execConfigCommand } from "../../../../util/config";
import { cx } from "../../../../util/cx";
import {
  ToggleButtonMenu,
  type ToggleButtonMenuItemProps,
  type ToggleButtonMenuProps,
} from "../../../atoms/toggle-button/ToggleButton";

export type PowerMenuProps = Omit<
  ToggleButtonMenuProps,
  "footer" | "iconName" | "title"
>;

export const PowerMenu = (props: PowerMenuProps) => {
  // Constants
  const items = [
    {
      label: "Suspend",
      onClicked: () => execConfigCommand("suspend"),
    },
    {
      label: "Restart",
      onClicked: () => execConfigCommand("restart"),
    },
    {
      label: "Power Off",
      onClicked: () => execConfigCommand("shutdown"),
    },
  ];

  return (
    <ToggleButtonMenu
      footer={
        <PowerMenuItem
          label="Log Out"
          onClicked={() => execConfigCommand("log-out")}
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
