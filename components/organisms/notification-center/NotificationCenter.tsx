import {
  NotificationList,
  NotificationListProps,
} from "../../molecules/notification-list/NotificationList";
import { createBinding, onCleanup, onMount } from "ags";

import { Gtk } from "ags/gtk4";
import { GtkBoxProps } from "../../../widgets/GtkBox";
import { GtkCalendar } from "../../../widgets/GtkCalendar";
import { MusicPlayer } from "../../molecules/music-player/MusicPlayer";
import Notifd from "gi://AstalNotifd";
import { WorldClocksList } from "../../molecules/world-clocks-list/WorldClocksList";
import { createPoll } from "ags/time";
import { cx } from "../../../util/cx";

export type NotificationCenterProps = GtkBoxProps &
  Pick<NotificationListProps, "window">;

export const NotificationCenter = (props: NotificationCenterProps) => {
  // Props
  const { class: classOverride, window, ...restProps } = props;

  // Constants
  const notifd = Notifd.get_default();

  // Refs
  let doNotDisturbSwitch: Gtk.Switch;

  // State
  const dateTime = createPoll(
    "",
    // Poll every minute.
    1000 * 60,
    'date +"%A %d %B %Y"'
  );
  const doNotDisturb = createBinding(notifd, "dontDisturb");
  const isWindowVisible = createBinding(window, "visible");

  // Handlers
  const onDoNotDisturbChanged = (_source: Gtk.Switch, state: boolean) => {
    notifd.set_dont_disturb(state);
  };

  let doNotDisturbSwitchStateSetHandlerId: number | undefined;

  // Lifecycle
  onMount(() => {
    doNotDisturbSwitchStateSetHandlerId = doNotDisturbSwitch.connect(
      "state-set",
      onDoNotDisturbChanged
    );
  });

  onCleanup(() => {
    if (doNotDisturbSwitchStateSetHandlerId !== undefined) {
      doNotDisturbSwitch.disconnect(doNotDisturbSwitchStateSetHandlerId);
    }
  });

  return (
    <box class={cx("divide-x divide-gray-500", classOverride)} {...restProps}>
      <box
        class="p-3"
        orientation={Gtk.Orientation.VERTICAL}
        valign={Gtk.Align.FILL}
        vexpand={false}
      >
        <MusicPlayer class="mb-3" />
        <box
          class="mb-3"
          halign={Gtk.Align.FILL}
          valign={Gtk.Align.FILL}
          vexpand
        >
          <NotificationList window={window} />
        </box>
        <box
          halign={Gtk.Align.FILL}
          hexpand
          valign={Gtk.Align.END}
          vexpand={false}
        >
          <box
            class="ml-1.5 space-x-3"
            halign={Gtk.Align.START}
            hexpand={false}
            valign={Gtk.Align.CENTER}
            vexpand={false}
          >
            <label
              class="text-sm font-semibold text-white"
              label="Do Not Disturb"
            />
            <switch
              $={(self) => {
                doNotDisturbSwitch = self;
              }}
              active={doNotDisturb}
              valign={Gtk.Align.CENTER}
              vexpand={false}
            />
          </box>
          <box
            halign={Gtk.Align.END}
            hexpand
            valign={Gtk.Align.CENTER}
            vexpand={false}
          >
            <button
              class="rounded-lg"
              halign={Gtk.Align.END}
              hexpand={false}
              valign={Gtk.Align.CENTER}
              vexpand={false}
              onClicked={() => {
                notifd.notifications.forEach((notification) =>
                  notification.dismiss()
                );
              }}
            >
              Clear All
            </button>
          </box>
        </box>
      </box>
      <box
        class="bg-gray-700 p-3 space-y-3"
        orientation={Gtk.Orientation.VERTICAL}
      >
        <box class="mt-1 ml-1.5 mb-1" orientation={Gtk.Orientation.VERTICAL}>
          <label
            class="text-sm font-bold text-gray-100"
            halign={Gtk.Align.START}
            label={dateTime.as((value) => value.split(" ", 1)[0])}
          />
          <label
            class="text-lg font-bold text-gray-100"
            halign={Gtk.Align.START}
            label={dateTime.as((value) => value.split(" ").slice(1).join(" "))}
          />
        </box>
        <GtkCalendar showDayNames showHeading showWeekNumbers />
        <WorldClocksList class="mt-4" visible={isWindowVisible} />
      </box>
    </box>
  );
};
