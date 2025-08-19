import Notifd from "gi://AstalNotifd";
import { createBinding, For, With } from "ags";
import { Gtk } from "ags/gtk4";
import { cx } from "../../../util/cx";
import {
  GtkScrolledWindow,
  type GtkScrolledWindowProps,
} from "../../../widgets/GtkScrolledWindow";
import {
  Notification,
  type NotificationProps,
} from "../../atoms/notification/Notification";

export type NotificationListProps = Omit<
  GtkScrolledWindowProps,
  "hscrollbarPolicy" | "minContentHeight" | "overflow" | "vscrollbarPolicy"
> &
  Pick<NotificationProps, "window">;

export const NotificationList = (props: NotificationListProps) => {
  // Props
  const { class: classOverride, window, ...restProps } = props;

  // Constants
  const notifd = Notifd.get_default();

  // State
  const currentNotifications = createBinding(notifd, "notifications").as(
    (notifications) => notifications.sort((a, b) => a.time - b.time),
  );

  return (
    <GtkScrolledWindow
      class={cx("rounded-t-xl", classOverride)}
      hscrollbarPolicy={Gtk.PolicyType.NEVER}
      minContentHeight={300}
      overflow={Gtk.Overflow.HIDDEN}
      vscrollbarPolicy={Gtk.PolicyType.EXTERNAL}
      {...restProps}
    >
      <box
        class="min-w-96 pb-3 space-y-3"
        hexpand={false}
        orientation={Gtk.Orientation.VERTICAL}
      >
        <For each={currentNotifications}>
          {(notification) => (
            <Notification
              notification={notification}
              onClickedDismiss={() => notification.dismiss()}
              showRelativeTime
              window={window}
            />
          )}
        </For>
        <With value={currentNotifications}>
          {(notifications) =>
            notifications.length === 0 && (
              <label
                class="text-gray-100 p-5"
                halign={Gtk.Align.CENTER}
                label="No notifications"
                valign={Gtk.Align.CENTER}
                vexpand={false}
              />
            )
          }
        </With>
      </box>
    </GtkScrolledWindow>
  );
};
