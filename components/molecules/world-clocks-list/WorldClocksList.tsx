import { Accessor, For, createState, onCleanup } from "ags";
import { ListBox, ListBoxProps } from "../../hocs/list-box/ListBox";
import { MapKey, MapValue } from "../../../util/map";

import { Gtk } from "ags/gtk4";
import { createPoll } from "ags/time";
import { exec } from "ags/process";

export type WorldClocksListProps = Omit<
  ListBoxProps,
  "selectionMode" | "subtitle" | "title" | "visible"
> & {
  readonly visible: NonNullable<ListBoxProps["visible"]>;
};

export const WorldClocksList = (props: WorldClocksListProps) => {
  // Props
  const { onNotifyVisible, ...restProps } = props;

  // Refs
  let windowVisibleUnsubscriber: (() => void) | undefined;
  let dateTimeUnsubscriber: (() => void) | undefined;

  // State
  const dateTime = createPoll("", 1000, 'date --iso-8601="minutes"');
  const [currentDateTime, setCurrentDateTime] = createState(dateTime.get());
  const [worldClocks, setWorldClocks] = createState<Array<WorldClock>>(
    getWorldClocks(currentDateTime.get())
  );

  // Lifecycle
  onCleanup(() => {
    windowVisibleUnsubscriber?.();
    dateTimeUnsubscriber?.();
  });

  return (
    <ListBox
      onNotifyVisible={(source, pspec) => {
        onNotifyVisible?.(source, pspec);

        // Unsubscribe from previous updates.
        dateTimeUnsubscriber?.();

        if (source.visible) {
          dateTimeUnsubscriber = dateTime.subscribe(() => {
            const newDateTime = dateTime.get();

            // Only update the world clocks if the UTC date time has changed.
            if (currentDateTime.get() !== newDateTime) {
              setCurrentDateTime(newDateTime);
              setWorldClocks(getWorldClocks(newDateTime));
            }
          });
        }
      }}
      selectionMode={Gtk.SelectionMode.NONE}
      subtitle={currentDateTime.as(
        () =>
          `Current: ${
            exec("timedatectl show -p Timezone --value")
              .split("/")
              .at(-1)
              ?.replace("_", " ") ?? "Unknown"
          }`
      )}
      title="World Clocks"
      {...restProps}
    >
      <For each={worldClocks}>
        {(worldClock) => (
          <ListBox.Item activatable={false} selectable={false}>
            <box class="space-x-2" hexpand>
              <label
                class="font-normal text-sm text-white"
                halign={Gtk.Align.START}
                label={worldClock.timeZone.name}
              />
              <label
                class="font-normal text-sm text-gray-100"
                halign={Gtk.Align.END}
                hexpand
                label={worldClock.dateTime}
              />
            </box>
          </ListBox.Item>
        )}
      </For>
    </ListBox>
  );
};

const timeZones = new Map([
  ["America/Los_Angeles", "Los Angeles"],
  ["Europe/Zurich", "Zurich"],
  ["Asia/Tokyo", "Tokyo"],
] as const);

type WorldClock = {
  readonly dateTime: string;
  readonly timeZone: {
    readonly id: MapKey<typeof timeZones>;
    readonly name: MapValue<typeof timeZones>;
  };
};

const getWorldClocks = (currentDateTime: string): Array<WorldClock> => {
  const date = new Date(currentDateTime);

  return [...timeZones.entries()].map(([id, name]) => {
    const dateTime = date.toLocaleString(undefined, {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      second: undefined,
      timeZone: id,
    });

    return {
      dateTime,
      timeZone: { id, name },
    };
  });
};
