import Network from "gi://AstalNetwork";
import AstalNetwork from "gi://AstalNetwork?version=0.1";
import { type Accessor, createBinding, createComputed, For, With } from "ags";
import type GObject from "ags/gobject";
import { Gtk } from "ags/gtk4";
import { execAsync } from "ags/process";
import { cx } from "../../../../util/cx";
import {
  getIconNameForNetworkClient,
  getLabelForNetworkClient,
} from "../../../../util/network-manager";
import {
  ToggleButton,
  ToggleButtonMenu,
  type ToggleButtonMenuItemProps,
  type ToggleButtonMenuProps,
  type ToggleButtonProps,
} from "../../../atoms/toggle-button/ToggleButton";

const network = Network.get_default();

export type NetworkToggleProps = Omit<
  ToggleButtonProps,
  "iconName" | "isActive" | "isExpandable" | "label" | "onClicked"
>;

export const NetworkToggle = (props: NetworkToggleProps) => {
  // State
  const networkClientConnectivity = createBinding(
    network,
    "client",
    "connectivity",
  );
  const networkClientPrimaryConnection = createBinding(
    network,
    "client",
    "primaryConnection",
  );
  const networkIsWifi = createBinding(network, "primary").as(
    (primary) => primary === AstalNetwork.Primary.WIFI,
  );
  const networkWifiEnabled = createBinding(network, "wifi", "enabled").as(
    (enabled) => enabled ?? false,
  );
  const networkWifiSsid = createBinding(network, "wifi", "ssid");
  const iconName = createComputed(() =>
    getIconNameForNetworkClient({
      connectivity: networkClientConnectivity(),
      primaryConnection: networkClientPrimaryConnection(),
    }),
  );
  const label = createComputed(() => {
    // Show the Wi-Fi SSID if the primary connection is Wi-Fi.
    if (networkIsWifi()) {
      return networkWifiSsid() ?? "Wi-Fi";
    }

    return getLabelForNetworkClient({
      primaryConnection: networkClientPrimaryConnection(),
    });
  });

  return (
    <ToggleButton
      isActive={networkWifiEnabled}
      isExpandable
      iconName={iconName}
      label={label}
      sensitive={networkWifiEnabled}
      onClicked={(_self) => {
        const wifi = network.wifi;
        if (!wifi) return;

        wifi.enabled = !wifi.enabled;
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
  const networkWifiScanning = createBinding(network, "wifi", "scanning").as(
    (scanning) => scanning ?? false,
  );
  const networkWifiAccessPoints = createBinding(
    network,
    "wifi",
    "accessPoints",
  ).as((accessPoints) =>
    (accessPoints ?? [])
      .reduce<Array<Network.AccessPoint>>((acc, accessPoint) => {
        return acc.some((ap) => ap.ssid === accessPoint.ssid)
          ? acc
          : accessPoint.ssid
            ? [...acc, accessPoint]
            : acc;
      }, [])
      .sort((a, b) => b.strength - a.strength)
      .slice(0, 10),
  );
  const networkWifiActiveAccessPoint = createBinding(
    network,
    "wifi",
    "activeAccessPoint",
  );

  return (
    <ToggleButtonMenu
      iconName="network-wireless-symbolic"
      isLoading={networkWifiScanning}
      onNotifyRevealChild={(
        source: Gtk.Revealer,
        pspec: GObject.ParamSpec<unknown>,
      ) => {
        onNotifyRevealChild?.(source, pspec);

        const wifi = network.wifi;
        if (!wifi?.enabled) return;

        if (source.revealChild) {
          wifi.scan();
        }
      }}
      title="Wi-Fi"
      {...restProps}
    >
      <box hexpand orientation={Gtk.Orientation.VERTICAL}>
        <For each={networkWifiAccessPoints}>
          {(accessPoint) => (
            <NetworkMenuItem
              accessPoint={accessPoint}
              activeAccessPoint={networkWifiActiveAccessPoint}
            />
          )}
        </For>
        <With value={networkWifiAccessPoints}>
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
  readonly activeAccessPoint: Accessor<Network.AccessPoint | null>;
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
  const isActive = createComputed(() => accessPoint === activeAccessPoint());

  return (
    <ToggleButtonMenu.Item
      class={cx("space-x-2", classOverride)}
      onClicked={(self) => {
        onClicked?.(self);

        const ssid = accessPoint.ssid;
        if (!ssid) return;

        if (isActive.peek()) {
          execAsync(["nmcli", "connection", "down", ssid]).catch(
            (error: unknown) => {
              console.error("Failed to disconnect from network: ", error);
            },
          );
        } else {
          execAsync(["nmcli", "device", "wifi", "connect", ssid]).catch(
            (error: unknown) => {
              console.error("Failed to connect to network: ", error);
            },
          );
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
        label={ssid.as((ssid) => ssid ?? "Unknown SSID")}
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
