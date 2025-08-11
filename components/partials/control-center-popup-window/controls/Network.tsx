import { Accessor, For, With, createBinding, createComputed } from "ags";
import {
  ToggleButton,
  ToggleButtonMenu,
  ToggleButtonMenuItemProps,
  ToggleButtonMenuProps,
  ToggleButtonProps,
} from "../../../atoms/toggle-button/ToggleButton";
import {
  getIconNameForDeviceType,
  getLabelForDeviceType,
} from "../../../../util/network-manager";

import GObject from "ags/gobject";
import { Gtk } from "ags/gtk4";
import Network from "gi://AstalNetwork";
import { cx } from "../../../../util/cx";
import { execAsync } from "ags/process";

const network = Network.get_default();

export type NetworkToggleProps = Omit<
  ToggleButtonProps,
  "iconName" | "isActive" | "isExpandable" | "label" | "onClicked"
>;

export const NetworkToggle = (props: NetworkToggleProps) => {
  // State
  const primaryConnectionDevice = createBinding(network, "client").as(
    (value) => value.primaryConnection.get_devices()[0]
  );
  const isWifiActive = createBinding(network.wifi, "enabled");
  const wifiSsid = createBinding(network.wifi, "ssid");
  const iconName = createComputed([primaryConnectionDevice], (device) =>
    getIconNameForDeviceType(device.deviceType)
  );
  const label = createComputed(
    [primaryConnectionDevice, wifiSsid],
    (device, ssid) => ssid || getLabelForDeviceType(device.deviceType)
  );

  return (
    <ToggleButton
      isActive={isWifiActive}
      isExpandable
      iconName={iconName}
      label={label}
      onClicked={(_self) => {
        network.wifi.enabled = !network.wifi.enabled;
      }}
      {...props}
    />
  );
};

export type NetworkMenuProps = Omit<
  ToggleButtonMenuProps,
  "iconName" | "isLoading" | "title"
>;

export const NetworkMenu = (props: NetworkMenuProps) => {
  // Props
  const { onNotifyRevealChild, ...restProps } = props;

  // State
  const isScanning = createBinding(network.wifi, "scanning");
  const wifiAccessPoints = createBinding(network.wifi, "accessPoints").as(
    (accessPoints) =>
      accessPoints
        .reduce<Array<Network.AccessPoint>>((acc, accessPoint) => {
          return acc.some((ap) => ap.ssid === accessPoint.ssid)
            ? acc
            : !!accessPoint.ssid
            ? [...acc, accessPoint]
            : acc;
        }, [])
        .sort((a, b) => b.strength - a.strength)
        .slice(0, 10)
  );
  const wifiActiveAccessPoint = createBinding(
    network.wifi,
    "activeAccessPoint"
  );

  return (
    <ToggleButtonMenu
      iconName="network-wireless-symbolic"
      isLoading={isScanning}
      onNotifyRevealChild={(
        source: Gtk.Revealer,
        pspec: GObject.ParamSpec<unknown>
      ) => {
        onNotifyRevealChild?.(source, pspec);

        if (!network.wifi.enabled) return;

        if (source.revealChild) {
          network.wifi.scan();
        }
      }}
      title="Wi-Fi"
      {...restProps}
    >
      <box hexpand orientation={Gtk.Orientation.VERTICAL}>
        <For each={wifiAccessPoints}>
          {(accessPoint) => (
            <NetworkMenuItem
              accessPoint={accessPoint}
              activeAccessPoint={wifiActiveAccessPoint}
            />
          )}
        </For>
        <With value={wifiAccessPoints}>
          {(accessPoints) =>
            accessPoints.length === 0 && (
              <label class="pt-1 pb-3" label="No networks found" />
            )
          }
        </With>
      </box>
    </ToggleButtonMenu>
  );
};

type NetworkMenuItemProps = ToggleButtonMenuItemProps & {
  readonly accessPoint: Network.AccessPoint;
  readonly activeAccessPoint: Accessor<Network.AccessPoint>;
};

const NetworkMenuItem = (props: NetworkMenuItemProps) => {
  // Props
  const {
    accessPoint,
    activeAccessPoint,
    class: classOverride,
    onClicked,
    ...restProps
  } = props;

  // State
  const iconName = createBinding(accessPoint, "iconName");
  const ssid = createBinding(accessPoint, "ssid");
  const isActive = createComputed(
    [activeAccessPoint],
    (value) => accessPoint === value
  );

  return (
    <ToggleButtonMenu.Item
      class={cx("space-x-2", classOverride)}
      onClicked={(self) => {
        onClicked?.(self);

        if (isActive.get()) {
          execAsync(["nmcli", "connection", "down", accessPoint.ssid]).catch(
            (error: unknown) => {
              console.error("Failed to disconnect from network: ", error);
            }
          );
        } else {
          execAsync([
            "nmcli",
            "device",
            "wifi",
            "connect",
            accessPoint.ssid,
          ]).catch((error: unknown) => {
            console.error("Failed to connect to network: ", error);
          });
        }
      }}
      {...restProps}
    >
      <image
        iconName={iconName}
        halign={Gtk.Align.START}
        hexpand={false}
        valign={Gtk.Align.CENTER}
        vexpand={false}
      />
      <label
        label={ssid}
        halign={Gtk.Align.START}
        hexpand
        valign={Gtk.Align.CENTER}
        vexpand={false}
      />
      <image
        iconName="object-select-symbolic"
        halign={Gtk.Align.END}
        hexpand={false}
        valign={Gtk.Align.CENTER}
        vexpand={false}
        visible={isActive}
      />
    </ToggleButtonMenu.Item>
  );
};
