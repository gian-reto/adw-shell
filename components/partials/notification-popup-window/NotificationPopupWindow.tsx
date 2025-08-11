import { Astal, Gtk } from "ags/gtk4";
import { With, createComputed, createState, onCleanup } from "ags";

import AstalIO from "gi://AstalIO";
import { GtkScrolledWindow } from "../../../widgets/GtkScrolledWindow";
import { GtkWindowProps } from "../../../widgets/GtkWindow";
import Notifd from "gi://AstalNotifd";
import { Notification } from "../../atoms/notification/Notification";
import app from "ags/gtk4/app";
import { calculateRegion } from "../../../util/region";
import { cx } from "../../../util/cx";
import { timeout } from "ags/time";

export type NotificationPopupWindowProps = Omit<
  GtkWindowProps,
  | "anchor"
  | "application"
  | "exclusivity"
  | "focusable"
  | "keymode"
  | "layer"
  | "name"
  | "visible"
> & {
  /**
   * Whether the popup window should be visible initially.
   */
  readonly visible?: boolean;
};

export const NotificationPopupWindow = (
  props: NotificationPopupWindowProps = {}
) => {
  // Props
  const {
    $,
    class: classOverride,
    visible: initiallyVisible = false,
    ...restProps
  } = props;

  // Constants
  const { LEFT, RIGHT, TOP } = Astal.WindowAnchor;
  const TRANSITION_DURATION_MS = 250;
  const notifd = Notifd.get_default();

  // Refs
  let revealerRef: Gtk.Revealer | undefined;
  let constrainWindowBoundsTimeoutRef: AstalIO.Time | undefined;
  let hideTimeoutRef: AstalIO.Time | undefined;
  let transitionTimeoutRef: AstalIO.Time | undefined;

  // State
  const [window, setWindow] = createState<Astal.Window | undefined>(undefined);
  const [isVisible, setVisible] = createState(initiallyVisible);
  const [childRevealed, setChildRevealed] = createState(false);
  const [notification, setNotification] = createState<
    Notifd.Notification | undefined
  >(undefined);
  const displayData = createComputed(
    [window, notification],
    (...values) => values
  );

  // Handlers
  const hideSelfImmediate = () => {
    setChildRevealed(false);
    setVisible(false);
    setNotification(undefined);
  };

  const hideSelfAnimated = () => {
    setChildRevealed(false);
    transitionTimeoutRef = timeout(TRANSITION_DURATION_MS, () => {
      setVisible(false);
      setNotification(undefined);
    });
  };

  const notifdNotifiedHandlerId = notifd.connect("notified", (self, id) => {
    if (self.get_dont_disturb() === true) return;

    const newNotification = notifd.get_notification(id);
    if (newNotification) {
      // Cancel any previous timeouts, if present.
      hideTimeoutRef?.cancel();
      transitionTimeoutRef?.cancel();
      constrainWindowBoundsTimeoutRef?.cancel();

      // If another notification is already visible, hide it first.
      if (notification.get()) {
        hideSelfImmediate();
      }

      setNotification(newNotification);
      setVisible(true);
      setChildRevealed(true);

      // Make the containing `window` transparent to clicks, except for the
      // region containing the notification widget. Note: It's necessary to wait
      // for the revealer to finish its transition before being able to
      // correctly compute the bounds of the notification widget.
      constrainWindowBoundsTimeoutRef = timeout(TRANSITION_DURATION_MS, () => {
        const currentWindow = window.get();
        if (!currentWindow || !revealerRef) return;

        const region = calculateRegion(currentWindow, revealerRef);
        window.get()?.get_surface()?.set_input_region(region);
      });

      // Auto-hide the notification after a while.
      hideTimeoutRef = timeout(4500, () => {
        hideSelfAnimated();
      });
    }
  });

  // Lifecycle
  onCleanup(() => {
    notifd.disconnect(notifdNotifiedHandlerId);
  });

  return (
    <window
      $={(self) => {
        $?.(self);

        setWindow(self);
      }}
      anchor={TOP | LEFT | RIGHT}
      application={app}
      class={cx("bg-transparent min-h-24 pt-1.5", classOverride)}
      exclusivity={Astal.Exclusivity.NORMAL}
      focusable={false}
      keymode={Astal.Keymode.NONE}
      layer={Astal.Layer.TOP}
      name="notification"
      visible={isVisible}
      {...restProps}
    >
      <revealer
        $={(self) => {
          revealerRef = self;
        }}
        halign={Gtk.Align.CENTER}
        hexpand={false}
        valign={Gtk.Align.START}
        vexpand={false}
        revealChild={childRevealed}
        transitionDuration={TRANSITION_DURATION_MS}
        transitionType={Gtk.RevealerTransitionType.SLIDE_DOWN}
      >
        <With value={displayData}>
          {([window, notification]) =>
            window &&
            notification && (
              <GtkScrolledWindow
                halign={Gtk.Align.CENTER}
                hexpand={false}
                hscrollbarPolicy={Gtk.PolicyType.NEVER}
                minContentHeight={200}
                overflow={Gtk.Overflow.HIDDEN}
                vscrollbarPolicy={Gtk.PolicyType.EXTERNAL}
              >
                <Notification
                  class={cx(
                    "min-w-96 shadow-xl shadow-black",
                    // Margins to prevent shadow clipping.
                    "mx-6 mb-6"
                  )}
                  notification={notification}
                  showRelativeTime
                  window={window}
                  onClickedDismiss={() => {
                    notification.dismiss();
                    hideSelfAnimated();
                  }}
                />
              </GtkScrolledWindow>
            )
          }
        </With>
      </revealer>
    </window>
  );
};
