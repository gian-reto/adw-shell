import AstalTray from "gi://AstalTray";
import { type Accessor, createBinding, For, onCleanup } from "ags";
import { Gtk } from "ags/gtk4";
import { cx } from "../../../util/cx";
import { unreachable } from "../../../util/unreachable";
import type { GtkBoxProps } from "../../../widgets/GtkBox";
import {
  GtkMenuButton,
  type GtkMenuButtonProps,
} from "../../../widgets/GtkMenuButton";

export type TrayProps = GtkBoxProps & {
  readonly extraItems?: Array<CustomTrayItem["data"]>;
};

export const Tray = (props: TrayProps) => {
  // Props
  const { class: classOverride, extraItems, ...restProps } = props;

  // Constants
  const tray = AstalTray.get_default();

  // State
  const trayItems = createBinding(tray, "items");

  return (
    <box class={cx("space-x-1", classOverride)} {...restProps}>
      <For each={trayItems}>
        {(item) => <TrayItem item={{ type: "astal", data: item }} />}
      </For>
      {extraItems &&
        extraItems.map((item) => (
          <TrayItem item={{ type: "custom", data: item }} />
        ))}
    </box>
  );
};

type AstalTrayItem = {
  readonly type: "astal";
  readonly data: AstalTray.TrayItem;
};

type CustomTrayItem = {
  readonly type: "custom";
  readonly data: {
    readonly iconName: string | Accessor<string>;
    readonly tooltipMarkup?: string | Accessor<string>;
    readonly onClicked?: () => void;
  };
};

type TrayItemProps = GtkMenuButtonProps & {
  readonly item: AstalTrayItem | CustomTrayItem;
};

const TrayItem = (props: TrayItemProps) => {
  // Props
  const { class: classOverride, item, ...restProps } = props;

  // Refs
  let itemDataHandlerId: number;

  // Handlers
  const handleDataChanged = (
    self: Gtk.MenuButton,
    item: AstalTray.TrayItem,
  ) => {
    if (!item.menuModel || item.menuModel.get_n_items() < 1) {
      self.set_menu_model(null);
      self.insert_action_group("dbusmenu", null);
      return;
    }

    self.set_menu_model(item.menuModel);
    self.insert_action_group("dbusmenu", item.actionGroup);
  };

  const handlePressed = (): boolean => {
    if (item.type === "custom" && item.data.onClicked) {
      item.data.onClicked();
      return true;
    }

    return false;
  };

  // Lifecycle
  onCleanup(() => {
    if (item.type === "astal" && itemDataHandlerId) {
      item.data.disconnect(itemDataHandlerId);
    }
  });

  return (
    <GtkMenuButton
      $={(self) => {
        switch (item.type) {
          case "astal":
            // Update menu once at the beginning.
            handleDataChanged(self, item.data);

            itemDataHandlerId = item.data.connect("changed", (item) => {
              handleDataChanged(self, item);
            });
            break;

          case "custom":
            // Do nothing.
            break;

          default:
            unreachable(item);
        }
      }}
      class={cx(
        "bg-transparent min-w-7 min-h-7 p-0 rounded-full transition-colors hover:bg-gray-800",
        classOverride,
      )}
      halign={Gtk.Align.CENTER}
      hexpand={false}
      valign={Gtk.Align.CENTER}
      vexpand={false}
      tooltipMarkup={
        item.type === "astal"
          ? createBinding(item.data, "tooltipMarkup")
          : item.data.tooltipMarkup
      }
      {...restProps}
    >
      <Gtk.GestureClick onPressed={handlePressed} />

      {item.type === "astal" ? (
        <image gicon={createBinding(item.data, "gicon")} />
      ) : (
        <image iconName={item.data.iconName} />
      )}
    </GtkMenuButton>
  );
};
