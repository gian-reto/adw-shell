import Gdk from "gi://Gdk";
import type Gio from "gi://Gio";
import type { Astal } from "ags/gtk4";
import app from "ags/gtk4/app";
import Bar from "./components/partials/bar/Bar";
import { ControlCenterPopupWindow } from "./components/partials/control-center-popup-window/ControlCenterPopupWindow";
import { LauncherPopupWindow } from "./components/partials/launcher-popup-window/LauncherPopupWindow";
import { NotificationCenterPopupWindow } from "./components/partials/notification-center-popup-window/NotificationCenterPopupWindow";
import { NotificationPopupWindow } from "./components/partials/notification-popup-window/NotificationPopupWindow";
import { getStylesheet } from "./theme";

// Track bars by monitor for proper cleanup on hotplug.
const bars = new Map<Gdk.Monitor, Astal.Window>();

function* monitorIterator(
  monitors: Gio.ListModel<Gdk.Monitor>,
): Generator<Gdk.Monitor> {
  for (let index = 0; ; index++) {
    const monitor = monitors.get_item(index);
    if (!monitor) return;
    yield monitor;
  }
}

function createBar(monitor: Gdk.Monitor): void {
  if (bars.has(monitor)) {
    return;
  }

  const bar = Bar({ gdkmonitor: monitor });
  bars.set(monitor, bar as Astal.Window);
}

function destroyBar(monitor: Gdk.Monitor): void {
  const bar = bars.get(monitor);
  if (bar) {
    bar.destroy();
    bars.delete(monitor);
  }
}

function setupMonitorListeners(): void {
  const display = Gdk.Display.get_default();
  if (!display) {
    return;
  }

  const monitors = display.get_monitors() as Gio.ListModel<Gdk.Monitor>;

  // Create bars for all current monitors.
  for (const monitor of monitorIterator(monitors)) {
    createBar(monitor);
  }

  // Handle monitor hotplug events.
  monitors.connect("items-changed", () => {
    // Build a set of currently connected monitors.
    const currentMonitors = new Set(monitorIterator(monitors));

    // Remove bars for monitors that are no longer present.
    for (const monitor of bars.keys()) {
      if (!currentMonitors.has(monitor)) {
        destroyBar(monitor);
      }
    }

    // Add bars for new monitors.
    for (const monitor of currentMonitors) {
      if (!bars.has(monitor)) {
        createBar(monitor);
      }
    }
  });
}

app.start({
  instanceName: "adw-shell",
  css: getStylesheet("adwaita-dark"),
  main() {
    setupMonitorListeners();

    ControlCenterPopupWindow({
      visible: false,
    });
    LauncherPopupWindow({
      visible: false,
    });
    NotificationCenterPopupWindow({
      visible: false,
    });
    NotificationPopupWindow({
      visible: false,
    });
  },
});

app.connect("request", (_self, argv, response) => {
  const [cmd, _arg, ..._rest] = argv;

  switch (cmd) {
    case "toggle-launcher":
      app.toggle_window("launcher");
      break;
    default:
      response("Unknown command");
      break;
  }
});
