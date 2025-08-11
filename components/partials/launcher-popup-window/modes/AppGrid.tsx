import { For, createBinding, createComputed, createState } from "ags";

import Apps from "gi://AstalApps";
import { Gtk } from "ags/gtk4";
import { GtkButtonProps } from "../../../../widgets/GtkButton";
import { GtkRevealerProps } from "../../../../widgets/GtkRevealer";
import { GtkScrolledWindow } from "../../../../widgets/GtkScrolledWindow";
import { chunk } from "../../../../util/array";
import { cx } from "../../../../util/cx";
import { getIconFromNameOrPath } from "../../../../util/icon";

export type AppGridProps = GtkRevealerProps & {
  /**
   * Reference of the parent window.
   */
  readonly window: Gtk.Window;
  readonly onItemClicked?: (source: Gtk.Button, app: Apps.Application) => void;
};

export const AppGrid = (props: AppGridProps) => {
  // Props
  const { onItemClicked, window, ...restProps } = props;

  // Constants
  const apps = new Apps.Apps();

  // State
  const [clickCount, setClickCount] = createState(0);
  const appsList = createBinding(apps, "list");
  const chunkedSortedApps = createComputed([appsList, clickCount], (value) =>
    chunk(
      value.sort((a, b) => b.frequency - a.frequency),
      6
    )
  );

  return (
    <revealer {...restProps}>
      <GtkScrolledWindow
        halign={Gtk.Align.CENTER}
        hexpand={false}
        hscrollbarPolicy={Gtk.PolicyType.NEVER}
        maxContentHeight={240}
        minContentHeight={240}
        overflow={Gtk.Overflow.HIDDEN}
        propagateNaturalWidth
        vscrollbarPolicy={Gtk.PolicyType.EXTERNAL}
      >
        <box
          halign={Gtk.Align.FILL}
          hexpand
          homogeneous
          orientation={Gtk.Orientation.VERTICAL}
          valign={Gtk.Align.START}
          vexpand={false}
        >
          <For each={chunkedSortedApps}>
            {(apps) => (
              <box
                halign={Gtk.Align.START}
                hexpand
                homogeneous
                valign={Gtk.Align.START}
                vexpand={false}
              >
                {apps.map((app) => (
                  <AppGridItem
                    app={app}
                    halign={Gtk.Align.CENTER}
                    hexpand={false}
                    valign={Gtk.Align.CENTER}
                    vexpand={false}
                    window={window}
                    onClicked={(self, app) => {
                      onItemClicked?.(self, app);

                      setClickCount((count) => count++);
                    }}
                  />
                ))}
              </box>
            )}
          </For>
        </box>
      </GtkScrolledWindow>
    </revealer>
  );
};

type AppGridItemProps = Omit<GtkButtonProps, "onClicked" | "tooltipText"> & {
  readonly app: Apps.Application;
  readonly onClicked?: (source: Gtk.Button, app: Apps.Application) => void;
  /**
   * Reference of the parent window.
   */
  readonly window: Gtk.Window;
};

const AppGridItem = (props: AppGridItemProps) => {
  // Props
  const { app, class: classOverride, onClicked, window, ...restProps } = props;

  // Constants
  const icon = getIconFromNameOrPath(app.iconName, window, 64);

  return (
    <button
      class={cx(
        "bg-transparent p-0 rounded-2xl hover:bg-gray-950",
        classOverride
      )}
      tooltipText={app.name}
      onClicked={(self) => {
        onClicked?.(self, app);
      }}
      {...restProps}
    >
      <image
        class="gtk-icon-style-regular gtk-icon-size-5xl min-w-20 min-h-20"
        file={icon.type === "file" ? icon.path : undefined}
        halign={Gtk.Align.CENTER}
        hexpand={false}
        paintable={icon.type === "paintable" ? icon.paintable : undefined}
        iconName={app.iconName}
        valign={Gtk.Align.CENTER}
        vexpand={false}
      />
    </button>
  );
};
