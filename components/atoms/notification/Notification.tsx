import Apps from "gi://AstalApps";
import type Notifd from "gi://AstalNotifd";
import Gio from "gi://Gio";
import GLib from "gi://GLib";
import Pango from "gi://Pango";
import { createState, onCleanup, With } from "ags";
import { Gtk } from "ags/gtk4";
import { createPoll } from "ags/time";
import { cx } from "../../../util/cx";
import { lookUpIcon } from "../../../util/icon";
import { isPathOfValidImage } from "../../../util/path";
import {
  ClickableBox,
  type ClickableBoxProps,
} from "../clickable-box/ClickableBox";
import { launch } from "../../../util/application";

const apps = new Apps.Apps({
  minScore: 1,
  nameMultiplier: 1,
});

export type NotificationProps = Omit<
  ClickableBoxProps,
  "hexpand" | "orientation" | "overflow" | "valign" | "vexpand"
> & {
  /**
   * Details of the notification to render.
   */
  readonly notification: Notifd.Notification;
  /**
   * Function called when the user clicks the dismiss button.
   */
  readonly onClickedDismiss?: (source: Gtk.Button) => void;
  /**
   * Whether to show the relative time of the notification (in addition to the
   * timestamp). Defaults to `true`.
   */
  readonly showRelativeTime?: boolean;
  /**
   * Reference of the parent window.
   */
  readonly window: Gtk.Window;
};

export const Notification = (props: NotificationProps) => {
  // Props
  const {
    $,
    class: classOverride,
    notification,
    onClicked,
    onClickedDismiss,
    showRelativeTime = true,
    window,
    ...restProps
  } = props;
  const { actions, appName, body, time, summary } = props.notification;
  const notificationImageFile = getNotificationImage(notification);
  const notificationIconPaintable = getNotificationIcon(
    notification,
    window,
    32,
  );
  const text = body.trim() === "" ? undefined : body.trim();
  const title = summary.trim() === "" ? appName.trim() : summary.trim();
  const labeledActions = actions.filter((action) => action.label !== "");

  // State
  const dateTime = createPoll("", 1000 * 60, 'date --iso-8601="minutes"');
  const [isHovering, setIsHovering] = createState(false);
  const [hasInvokableActions, setHasInvokableActions] = createState(
    actions.length > 0 && notificationIsRecent(notification),
  );
  const dateTimeUnsubscriber = dateTime.subscribe(() => {
    if (!hasInvokableActions) {
      return;
    }
    if (labeledActions.length === 0) {
      return;
    }

    setHasInvokableActions(notificationIsRecent(notification));
  });

  // Hover event controller
  const motion = new Gtk.EventControllerMotion();
  const motionEnterHandlerId = motion.connect("enter", (_source) => {
    setIsHovering(true);
  });
  const motionLeaveHandlerId = motion.connect("leave", (_source) => {
    setIsHovering(false);
  });

  // Lifecycle
  onCleanup(() => {
    dateTimeUnsubscriber();
    motion.disconnect(motionEnterHandlerId);
    motion.disconnect(motionLeaveHandlerId);
  });

  return (
    <ClickableBox
      $={(self) => {
        $?.(self);

        self.add_controller(motion);
      }}
      class={cx(
        "bg-gray-400 duration-100 pt-2.5 rounded-xl shadow-sm",
        classOverride,
      )}
      hexpand
      orientation={Gtk.Orientation.VERTICAL}
      overflow={Gtk.Overflow.HIDDEN}
      valign={Gtk.Align.START}
      vexpand={false}
      onClicked={(self) => {
        onClicked?.(self);

        if (appName === "") return;

        // If the notification has a single, unlabeled action, invoke it. Note:
        // This condition will only be respected in the first minute after the
        // notification was created, as the actions will likely be unavailable
        // after that time.
        if (
          actions.length === 1 &&
          actions[0].label === "" &&
          notificationIsRecent(notification)
        ) {
          notification.invoke(actions[0].id);
          return;
        }

        // In all other cases, find the app by name and launch it if possible.
        const app = apps.exact_query(appName).at(0);
        if (app) {
          launch(app);
        }
      }}
      {...restProps}
    >
      <box class="pl-4 pb-3 pr-2.5 space-x-2.5" vexpand={false}>
        {notificationImageFile || notificationIconPaintable ? (
          <image
            class="min-w-8 min-h-8 pt-1"
            file={notificationImageFile?.get_path() ?? undefined}
            halign={Gtk.Align.START}
            hexpand={false}
            paintable={notificationIconPaintable}
            valign={Gtk.Align.START}
            vexpand={false}
          />
        ) : null}
        <box
          class="space-y-1"
          halign={Gtk.Align.FILL}
          hexpand
          orientation={Gtk.Orientation.VERTICAL}
          valign={Gtk.Align.START}
          vexpand={false}
        >
          <box
            class="space-x-2"
            halign={Gtk.Align.FILL}
            hexpand
            valign={Gtk.Align.START}
            vexpand={false}
          >
            <label
              class="font-semibold text-white"
              ellipsize={Pango.EllipsizeMode.END}
              halign={Gtk.Align.START}
              justify={Gtk.Justification.LEFT}
              label={title}
              lines={1}
              valign={Gtk.Align.CENTER}
              vexpand={false}
            />
            <label
              class="text-xs text-gray-100"
              halign={Gtk.Align.START}
              hexpand
              justify={Gtk.Justification.LEFT}
              label={dateTime.as((_value) =>
                showRelativeTime
                  ? `${formatTime(time)} (${formatTimeRelative(time)})`
                  : (formatTime(time) ?? ""),
              )}
              valign={Gtk.Align.CENTER}
              vexpand={false}
            />
            <button
              class={cx(
                "min-h-5 min-w-5 p-px rounded-full transition-opacity",
                isHovering.as((value) => (value ? "opacity-100" : "opacity-0")),
              )}
              halign={Gtk.Align.END}
              hexpand={false}
              valign={Gtk.Align.CENTER}
              vexpand={false}
              onClicked={(source) => {
                onClickedDismiss?.(source);
              }}
            >
              <image class="text-md" iconName="window-close-symbolic" />
            </button>
          </box>
          {text && (
            <label
              class="pr-1.5 text-md text-gray-50"
              ellipsize={Pango.EllipsizeMode.END}
              halign={Gtk.Align.START}
              hexpand
              justify={Gtk.Justification.LEFT}
              label={text}
              lines={2}
              useMarkup
              valign={Gtk.Align.START}
              vexpand={false}
              wrap
              wrapMode={Gtk.WrapMode.CHAR}
              xalign={0}
              yalign={0}
            />
          )}
        </box>
      </box>
      <With value={hasInvokableActions}>
        {(value) =>
          value && (
            <box
              class="divide-x divide-gray-200"
              halign={Gtk.Align.FILL}
              hexpand
              homogeneous
              valign={Gtk.Align.END}
              vexpand={false}
            >
              {labeledActions.map(({ id, label }) => (
                <ClickableBox
                  class="bg-gray-300 px-3 py-3 rounded-none text-white transition-colors hover:bg-gray-200"
                  halign={Gtk.Align.FILL}
                  hexpand
                  valign={Gtk.Align.CENTER}
                  vexpand={false}
                  onClicked={() => {
                    notification.invoke(id);
                  }}
                >
                  <label
                    class="font-semibold text-sm text-white"
                    ellipsize={Pango.EllipsizeMode.END}
                    halign={Gtk.Align.CENTER}
                    hexpand
                    label={label}
                    maxWidthChars={30 / labeledActions.length}
                    valign={Gtk.Align.CENTER}
                    vexpand={false}
                    wrap={false}
                  />
                </ClickableBox>
              ))}
            </box>
          )
        }
      </With>
    </ClickableBox>
  );
};

const formatTime = (time: number, format = "%H:%M"): string | null =>
  GLib.DateTime.new_from_unix_local(time).format(format);

const formatTimeRelative = (time: number): string => {
  const now = GLib.DateTime.new_now_local();
  const then = GLib.DateTime.new_from_unix_local(time);

  // Convert microseconds to seconds.
  const diff = now.difference(then) / 1_000_000;

  if (diff < 60) {
    return "Just now";
  }

  if (diff < 120) {
    return "1 minute ago";
  }

  if (diff < 3600) {
    return `${Math.floor(diff / 60)} minutes ago`;
  }

  if (diff < 7200) {
    return "1 hour ago";
  }

  if (diff < 86400) {
    return `${Math.floor(diff / 3600)} hours ago`;
  }

  if (diff < 172800) {
    return "1 day ago";
  }

  return `${Math.floor(diff / 86400)} days ago`;
};

/**
 * Returns the notification's image or app icon as a {@link Gio.File}, if it
 * exists and is a valid image file. Otherwise, returns `undefined`.
 *
 * Note: If the notification only contains icon names, this function will return
 * `undefined` as well, as it only looks for valid image paths.
 */
const getNotificationImage = (
  notification: Notifd.Notification,
): Gio.File | undefined => {
  const { appIcon, image } = notification;

  if (
    !notificationHasAppIcon(notification) &&
    !notificationHasImage(notification)
  ) {
    return undefined;
  }
  if (isPathOfValidImage(appIcon)) {
    return Gio.File.new_for_path(appIcon);
  }
  if (isPathOfValidImage(image)) {
    return Gio.File.new_for_path(image);
  }

  return undefined;
};

/**
 * Returns the notification's app icon as a {@link Gtk.IconPaintable}, if it
 * exists and is a valid icon name. Otherwise, returns `undefined`.
 *
 * Note: If the notification only contains image paths, this function will
 * return `undefined` as well, as it only looks for valid icon names.
 */
const getNotificationIcon = (
  notification: Notifd.Notification,
  window: Gtk.Window,
  size: number,
): Gtk.IconPaintable | undefined => {
  const { appIcon, appName } = notification;

  const iconName = notificationHasAppIcon(notification)
    ? appIcon
    : apps.exact_query(appName).at(0)?.iconName;

  if (iconName === undefined) {
    return undefined;
  }
  // Only return a paintable if the icon is NOT a valid image path (because if
  // that would be the case, `getNotificationImage` should be used instead).
  if (isPathOfValidImage(iconName)) {
    return undefined;
  }

  return lookUpIcon(iconName, window.get_scale_factor(), size);
};

const notificationHasAppIcon = (notification: Notifd.Notification) =>
  notification.appIcon && notification.appIcon.length > 0;

const notificationHasImage = (notification: Notifd.Notification) =>
  notification.image && notification.image.length > 0;

/**
 * Returns `true` if the notification was created within the last minute. This
 * is useful to determine whether the notification's actions are likely still
 * invokable.
 */
const notificationIsRecent = (notification: Notifd.Notification): boolean => {
  if (
    GLib.DateTime.new_now_local().difference(
      GLib.DateTime.new_from_unix_local(notification.time),
    ) <
    60 * 1_000_000
  ) {
    return true;
  }

  return false;
};
