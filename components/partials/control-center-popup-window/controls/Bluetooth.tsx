import {
  Accessor,
  For,
  With,
  createBinding,
  createComputed,
  onCleanup,
  onMount,
} from "ags";
import {
  ToggleButton,
  ToggleButtonMenu,
  ToggleButtonMenuItemProps,
  ToggleButtonMenuProps,
  ToggleButtonProps,
} from "../../../atoms/toggle-button/ToggleButton";

import Bluetooth from "gi://AstalBluetooth";
import GObject from "ags/gobject";
import { Gtk } from "ags/gtk4";
import { cx } from "../../../../util/cx";
import { debounce } from "../../../../util/debounce";
import { execAsync } from "ags/process";
import { unreachable } from "../../../../util/unreachable";

const bluetooth = Bluetooth.get_default();

export type BluetoothToggleProps = Omit<
  ToggleButtonProps,
  "iconName" | "isActive" | "isExpandable" | "label" | "onClicked"
>;

export const BluetoothToggle = (props: BluetoothToggleProps) => {
  // State
  const isPowered = createBinding(bluetooth, "isPowered");
  const isConnected = createBinding(bluetooth, "isConnected");
  const isActive = createComputed(
    [isPowered, isConnected],
    (isPowered, isConnected) => isPowered || isConnected
  );
  const connectedDevice = createBinding(bluetooth, "devices").as((devices) =>
    devices.length > 0 ? devices.find((device) => device.connected) : undefined
  );
  const iconName = createComputed(
    [isPowered, isConnected],
    (isPowered, isConnected) =>
      isPowered || isConnected
        ? "bluetooth-active-symbolic"
        : "bluetooth-disabled-symbolic"
  );
  const label = createComputed(
    [connectedDevice, isPowered],
    (connectedDevice, isPowered) =>
      connectedDevice?.alias || (isPowered ? "Bluetooth" : "Disabled")
  );

  return (
    <ToggleButton
      isActive={isActive}
      isExpandable
      iconName={iconName}
      label={label}
      onClicked={() => bluetooth.toggle()}
      {...props}
    />
  );
};

export type BluetoothMenuProps = Omit<
  ToggleButtonMenuProps,
  "iconName" | "isLoading" | "title"
>;

export const BluetoothMenu = (props: BluetoothMenuProps) => {
  // Props
  const { onNotifyRevealChild, ...restProps } = props;

  // State
  const isDiscovering = createBinding(bluetooth.adapter, "discovering");
  const devices = createBinding(bluetooth, "devices").as((value) =>
    value
      .filter((device) => !!device.name && !device.blocked)
      .sort((a, b) => {
        if (a.connected && !b.connected) return -1;
        if (!a.connected && b.connected) return 1;

        return b.rssi - a.rssi;
      })
      .sort((a, b) => b.rssi - a.rssi)
      .slice(0, 10)
  );

  return (
    <ToggleButtonMenu
      iconName="bluetooth-active-symbolic"
      isLoading={isDiscovering}
      onNotifyRevealChild={(
        source: Gtk.Revealer,
        pspec: GObject.ParamSpec<unknown>
      ) => {
        onNotifyRevealChild?.(source, pspec);

        if (!bluetooth.adapter.powered) return;

        if (source.revealChild && !bluetooth.adapter.discovering) {
          try {
            bluetooth.adapter.start_discovery();
          } catch (error: unknown) {
            console.error(
              "Failed to start bluetooth discovery. Trigger: revealer expanded. Error: ",
              error
            );
          }
          return;
        }

        if (!source.revealChild && bluetooth.adapter.discovering) {
          bluetooth.adapter.stop_discovery();
        }
      }}
      title="Bluetooth"
      {...restProps}
    >
      <box hexpand orientation={Gtk.Orientation.VERTICAL}>
        <For each={devices}>
          {(device) => <BluetoothMenuItem device={device} />}
        </For>
        <With value={devices}>
          {(value) =>
            value.length === 0 && (
              <label class="pt-1 pb-3" label="No devices found" />
            )
          }
        </With>
      </box>
    </ToggleButtonMenu>
  );
};

type BluetoothMenuItemProps = ToggleButtonMenuItemProps & {
  readonly device: Bluetooth.Device;
};

const BluetoothMenuItem = (props: BluetoothMenuItemProps) => {
  // Props
  const { class: classOverride, device, ...restProps } = props;

  // Refs
  let connectSwitch: Gtk.Switch;

  // State
  const alias = createBinding(device, "alias");
  const icon = createBinding(device, "icon");
  const isConnecting = createBinding(device, "connecting");
  const isConnected = createBinding(device, "connected");

  // Handlers
  const setConnectionOrPairing = (targetState: "on" | "off"): void => {
    // Prevent setting connection or pairing again while connecting.
    if (device.get_connecting()) return;

    switch (targetState) {
      case "on":
        if (device.get_connected()) {
          // Already connected.
          return;
        }

        if (device.get_paired()) {
          connectDevice(device);
        }

        // Pair and connect.
        try {
          device.pair();
        } catch (error: unknown) {
          console.error("Failed to pair device: ", error);
        }
        break;

      case "off":
        if (device.get_connected()) {
          disconnectDevice(device);
        }
        break;

      default:
        unreachable(targetState);
    }
  };

  const debouncedSetConnectionOrPairing = debounce(setConnectionOrPairing, {
    waitForMs: 1_000,
    immediate: true,
  });

  const onConnectChanged = (_source: Gtk.Switch, state: boolean) => {
    debouncedSetConnectionOrPairing(state ? "on" : "off");
  };

  let connectSwitchStateSetHandlerId: number | undefined;

  // Lifecycle
  onMount(() => {
    connectSwitchStateSetHandlerId = connectSwitch.connect(
      "state-set",
      onConnectChanged
    );
  });

  onCleanup(() => {
    if (connectSwitchStateSetHandlerId !== undefined) {
      connectSwitch.disconnect(connectSwitchStateSetHandlerId);
    }
  });

  return (
    <ToggleButtonMenu.Item
      class={cx("space-x-2", classOverride)}
      {...restProps}
    >
      <image
        iconName={icon}
        halign={Gtk.Align.START}
        hexpand={false}
        valign={Gtk.Align.CENTER}
        vexpand={false}
        visible={icon.as((icon) => !!icon)}
      />
      <label
        label={alias}
        halign={Gtk.Align.START}
        hexpand
        valign={Gtk.Align.CENTER}
        vexpand={false}
      />
      <Gtk.Spinner
        class="text-white"
        halign={Gtk.Align.END}
        hexpand={false}
        spinning={isConnecting}
        valign={Gtk.Align.CENTER}
        vexpand={false}
        visible={isConnecting}
      />
      <switch
        $={(self) => {
          connectSwitch = self;
        }}
        active={isConnected}
        halign={Gtk.Align.END}
        hexpand={false}
        valign={Gtk.Align.CENTER}
        vexpand={false}
      />
    </ToggleButtonMenu.Item>
  );
};

const connectDevice = (device: Bluetooth.Device): void => {
  // TODO: Seems to fail right now. Investigate later.
  //
  // device.connect_device().catch((error: unknown) => {
  //   console.error("Failed to connect device: ", error);
  // });
  execAsync(["bluetoothctl", "connect", device.get_address()]).catch(
    (error: unknown) => {
      console.error("Failed to connect device: ", error);
    }
  );
  return;
};

const disconnectDevice = (device: Bluetooth.Device): void => {
  // TODO: Seems to fail right now. Investigate later.
  //
  // device.disconnect_device().catch((error: unknown) => {
  //   console.error("Failed to disconnect device: ", error);
  // });
  execAsync(["bluetoothctl", "disconnect", device.get_address()]).catch(
    (error: unknown) => {
      console.error("Failed to disconnect device: ", error);
    }
  );
};
