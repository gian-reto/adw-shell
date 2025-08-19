import Battery from "gi://AstalBattery";
import Bluetooth from "gi://AstalBluetooth?version=0.1";
import Network from "gi://AstalNetwork";
import {
  Accessor,
  createBinding,
  createComputed,
  createState,
  With,
} from "ags";
import { Astal, Gdk, Gtk } from "ags/gtk4";
import { execAsync } from "ags/process";
import { cx } from "../../../util/cx";
import type { GtkButtonProps } from "../../../widgets/GtkButton";
import {
  PopupWindow,
  type PopupWindowProps,
} from "../../hocs/popup-window/PopupWindow";
import { BluetoothMenu, BluetoothToggle } from "./controls/Bluetooth";
import { MicrophoneToggle } from "./controls/Microphone";
import { NetworkMenu, NetworkToggle } from "./controls/Network";
import { PowerMenu } from "./controls/Power";
import { VolumeSlider } from "./controls/Volume";

export type ControlCenterPopupWindowProps = Omit<
  PopupWindowProps,
  "exclusivity" | "name" | "position"
>;

export const ControlCenterPopupWindow = (
  props: ControlCenterPopupWindowProps,
) => {
  // Props
  const { $, ...restProps } = props;

  // Constants
  const battery = Battery.get_default();
  const bluetooth = Bluetooth.get_default();
  const network = Network.get_default();

  // State
  const [window, setWindow] = createState<Astal.Window | undefined>(undefined);
  const [expandedMenu, setExpandedMenu] = createState<
    "none" | "bluetooth" | "network" | "power"
  >("none");
  const isBattery = createBinding(battery, "isBattery");
  const batteryIconName = createBinding(battery, "iconName");
  const batteryPercentage = createBinding(battery, "percentage");
  const powerIconName = createComputed([isBattery, batteryIconName]).as(
    ([isBattery, iconName]) => (isBattery ? iconName : "ac-adapter-symbolic"),
  );
  const powerPercentage = createComputed([isBattery, batteryPercentage]).as(
    ([isBattery, percentage]) => (isBattery ? `${percentage * 100}%` : "100%"),
  );
  const isBluetoothPowered = createBinding(bluetooth, "isPowered");
  const isBluetoothConnected = createBinding(bluetooth, "isConnected");
  const isBluetoothPoweredOrConnected = createComputed(
    [isBluetoothPowered, isBluetoothConnected],
    (isPowered, isConnected) => isPowered || isConnected,
  );
  const isWifiEnabled = createBinding(network.wifi, "enabled");

  return (
    <PopupWindow
      $={(self) => {
        $?.(self);

        setWindow(self);
      }}
      exclusivity={Astal.Exclusivity.EXCLUSIVE}
      name="control-center"
      position="right-top"
      {...restProps}
    >
      <With value={window}>
        {(value) =>
          value && (
            <box
              class={cx(
                "bg-gray-600 border border-gray-500 mt-1.5 mr-1.5",
                // Margins to prevent shadow clipping.
                "ml-6 mb-6",
                "p-4 rounded-4xl shadow-xl shadow-black",
              )}
              orientation={Gtk.Orientation.VERTICAL}
              overflow={Gtk.Overflow.HIDDEN}
            >
              <box>
                <box
                  halign={Gtk.Align.START}
                  hexpand
                  valign={Gtk.Align.CENTER}
                  vexpand={false}
                >
                  <IconButton
                    iconName={powerIconName}
                    label={powerPercentage}
                  />
                </box>
                <box
                  class="space-x-2"
                  halign={Gtk.Align.END}
                  hexpand
                  valign={Gtk.Align.CENTER}
                  vexpand={false}
                >
                  <IconButton
                    iconName="applets-screenshooter-symbolic"
                    onClicked={() => {
                      execAsync([
                        "grimblast",
                        "--notify",
                        "--freeze",
                        "copy",
                        "area",
                      ]).catch((error: unknown) => {
                        console.error("Failed to take screenshot: ", error);
                      });
                    }}
                  />
                  <IconButton
                    iconName="system-lock-screen-symbolic"
                    onClicked={() => {
                      execAsync(["hyprlock"]).catch((error: unknown) => {
                        console.error("Failed to lock session: ", error);
                      });
                    }}
                  />
                  <IconButton
                    iconName="weather-clear-night-symbolic"
                    onClicked={() => {
                      execAsync(["systemctl", "suspend"]).catch(
                        (error: unknown) => {
                          console.error("Failed to suspend: ", error);
                        },
                      );
                    }}
                  />
                  <IconButton
                    iconName="system-shutdown-symbolic"
                    onClicked={() =>
                      expandedMenu.get() === "power"
                        ? setExpandedMenu("none")
                        : setExpandedMenu("power")
                    }
                  />
                </box>
              </box>
              <PowerMenu
                revealChild={expandedMenu.as((value) => value === "power")}
              />
              <box
                class="mt-4"
                homogeneous
                orientation={Gtk.Orientation.VERTICAL}
              >
                <VolumeSlider class="px-1.5" />
              </box>
              <box class="mt-4 space-x-2.5" homogeneous>
                <NetworkToggle
                  isExpanded={expandedMenu.as((value) => value === "network")}
                  onCollapsed={() => setExpandedMenu("none")}
                  onExpanded={() => setExpandedMenu("network")}
                />
                <BluetoothToggle
                  isExpanded={expandedMenu.as((value) => value === "bluetooth")}
                  onCollapsed={() => setExpandedMenu("none")}
                  onExpanded={() => setExpandedMenu("bluetooth")}
                />
              </box>
              <BluetoothMenu
                isActive={isBluetoothPoweredOrConnected}
                revealChild={expandedMenu.as((value) => value === "bluetooth")}
              />
              <NetworkMenu
                isActive={isWifiEnabled}
                revealChild={expandedMenu.as((value) => value === "network")}
              />
              <box class="mt-3 space-x-2.5" homogeneous>
                <MicrophoneToggle />
                {/* Stub box for spacing. */}
                <box />
              </box>
            </box>
          )
        }
      </With>
    </PopupWindow>
  );
};

type IconButtonProps = Omit<GtkButtonProps, "iconName"> & {
  readonly iconName: NonNullable<GtkButtonProps["iconName"]>;
};

const IconButton = (props: IconButtonProps) => {
  // Props
  const {
    class: classOverride,
    iconName,
    label,
    onClicked,
    ...restProps
  } = props;

  return (
    <button
      class={cx(
        "bg-gray-400 min-w-10 min-h-10 p-px rounded-full text-white",
        label && "px-4",
        onClicked && "hover:bg-gray-300",
        classOverride,
      )}
      hexpand={false}
      vexpand={false}
      onClicked={(self) => {
        onClicked?.(self);
      }}
      {...restProps}
    >
      <box
        class="space-x-2"
        halign={Gtk.Align.CENTER}
        hexpand={false}
        valign={Gtk.Align.CENTER}
        vexpand={false}
      >
        <image
          class="text-xl"
          iconName={iconName}
          iconSize={Gtk.IconSize.NORMAL}
          halign={Gtk.Align.CENTER}
          hexpand={false}
          valign={Gtk.Align.CENTER}
          vexpand={false}
        />
        {label && (
          <label
            class="font-bold text-sm"
            label={label}
            halign={Gtk.Align.END}
            hexpand={false}
            valign={Gtk.Align.CENTER}
            vexpand={false}
          />
        )}
      </box>
    </button>
  );
};
