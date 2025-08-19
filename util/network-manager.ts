import NM from "gi://NM";
import { unreachable } from "./unreachable";

const getIconNameForDeviceType = (deviceType: NM.DeviceType): string => {
  switch (deviceType) {
    case NM.DeviceType.ETHERNET:
      return "network-wired-symbolic";

    case NM.DeviceType.WIFI:
      return "network-wireless-symbolic";

    case NM.DeviceType.TUN:
    case NM.DeviceType.WIREGUARD:
      return "network-vpn-symbolic";

    case NM.DeviceType.MODEM:
      // TODO: Return correct icon for the current ModemManager
      // connection type. Probably queryable from DBus (see:
      // https://github.com/System64fumo/sysbar/blob/main/src/modules/cellular.cpp).
      return "network-cellular-connected-symbolic";

    default:
      // Just return the wired icon for all other device types.
      return "network-wired-symbolic";
  }
};

export const getIconNameForClient = (client: NM.Client): string => {
  switch (client.connectivity) {
    case NM.ConnectivityState.NONE:
    case NM.ConnectivityState.PORTAL:
    case NM.ConnectivityState.UNKNOWN:
      return "network-offline-symbolic";

    case NM.ConnectivityState.LIMITED:
      return "network-no-route-symbolic";

    case NM.ConnectivityState.FULL:
      // Ignore this case to return the correct device icon below.
      break;

    default:
      return unreachable(client.connectivity);
  }

  const device = client.primaryConnection?.get_devices()[0];
  // `device` should be defined at this point, but still fall back to the
  // offline icon if there's no `primaryConnection` or no devices.
  if (!device) {
    return "network-offline-symbolic";
  }

  return getIconNameForDeviceType(device.deviceType);
};

const getLabelForDeviceType = (deviceType: NM.DeviceType): string => {
  switch (deviceType) {
    case NM.DeviceType.ETHERNET:
      return "Ethernet";

    case NM.DeviceType.WIFI:
      return "Wi-Fi";

    case NM.DeviceType.TUN:
    case NM.DeviceType.WIREGUARD:
      return "VPN";

    case NM.DeviceType.MODEM:
      return "Cellular";

    default:
      return "Unknown";
  }
};

export const getLabelForClient = (client: NM.Client): string => {
  const device = client.primaryConnection?.get_devices()[0];
  if (!device) {
    return "No Network";
  }

  return getLabelForDeviceType(device.deviceType);
};
