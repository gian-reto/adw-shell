import Bar from "./components/partials/bar/Bar";
import { ControlCenterPopupWindow } from "./components/partials/control-center-popup-window/ControlCenterPopupWindow";
import { LauncherPopupWindow } from "./components/partials/launcher-popup-window/LauncherPopupWindow";
import { NotificationCenterPopupWindow } from "./components/partials/notification-center-popup-window/NotificationCenterPopupWindow";
import { NotificationPopupWindow } from "./components/partials/notification-popup-window/NotificationPopupWindow";
import app from "ags/gtk4/app";
import { getStylesheet } from "./theme";

app.start({
  instanceName: "adw-shell",
  css: getStylesheet("adwaita-dark"),
  main() {
    app.get_monitors().map((monitor) =>
      Bar({
        gdkmonitor: monitor,
      }),
    );

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
