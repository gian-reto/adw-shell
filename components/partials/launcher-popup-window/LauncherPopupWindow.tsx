import Apps from "gi://AstalApps";
import { createComputed, createState, With } from "ags";
import { Astal, Gtk } from "ags/gtk4";
import { cx } from "../../../util/cx";
import { unreachable } from "../../../util/unreachable";
import {
  PopupWindow,
  type PopupWindowProps,
} from "../../hocs/popup-window/PopupWindow";
import { AppGrid } from "./modes/AppGrid";
import { AppSearch } from "./modes/AppSearch";
import { launch } from "../../../util/application";

export type LauncherPopupWindowProps = Omit<
  PopupWindowProps,
  "exclusivity" | "name" | "position"
>;

export const LauncherPopupWindow = (props: LauncherPopupWindowProps) => {
  // Props
  const { $, ...restProps } = props;

  // Constants
  const apps = new Apps.Apps();

  // Refs
  let entryRef: Gtk.Entry | undefined;

  // State
  const [window, setWindow] = createState<Astal.Window | undefined>(undefined);
  const [topAppSearchResult, setTopAppSearchResult] = createState<
    Apps.Application | undefined
  >(undefined);
  const [entryText, setEntryText] = createState("");
  const entryDirty = createComputed([entryText], (value) => value !== "");
  const launcherMode = createComputed([entryText], (value) => {
    if (value === "") {
      return "app-grid";
    }

    return "app-search";
  });

  // Handlers
  const close = () => {
    window?.get()?.set_visible(false);
  };

  const focusEntry = () => {
    if (!entryRef) return;

    entryRef.set_position(-1);
    entryRef.select_region(0, -1);
    entryRef.grab_focus();
  };

  return (
    <PopupWindow
      $={(self) => {
        $?.(self);

        setWindow(self);
      }}
      exclusivity={Astal.Exclusivity.EXCLUSIVE}
      name="launcher"
      position="center-center"
      onNotifyVisible={({ visible }) => {
        if (visible) {
          focusEntry();
          apps.reload();
        }
      }}
      {...restProps}
    >
      <With value={window}>
        {(value) =>
          value && (
            <box
              class="bg-black/80 p-5 rounded-3xl"
              halign={Gtk.Align.CENTER}
              hexpand={false}
              orientation={Gtk.Orientation.VERTICAL}
              valign={Gtk.Align.CENTER}
              vexpand={false}
            >
              <entry
                $={(self) => {
                  entryRef = self;
                }}
                class={cx(
                  "launcher-entry",
                  entryDirty.as((value) => value && "dirty"),
                )}
                hasFrame={false}
                halign={Gtk.Align.FILL}
                hexpand
                placeholderText="Search"
                primaryIconName="system-search-symbolic"
                valign={Gtk.Align.START}
                vexpand={false}
                onActivate={(_self) => {
                  const currentLauncherMode = launcherMode.get();

                  switch (currentLauncherMode) {
                    case "app-grid":
                      // Do nothing.
                      break;

                    case "app-search":
                      launch(topAppSearchResult.get());
                      break;

                    default:
                      unreachable(currentLauncherMode);
                  }

                  close();
                }}
                onNotifyText={(self) => setEntryText(self.get_text() || "")}
              />
              <AppGrid
                revealChild={launcherMode.as((value) => value === "app-grid")}
                window={value}
                onItemClicked={(_source, app) => {
                  launch(app);
                  close();
                }}
              />
              <revealer
                revealChild={launcherMode.as((value) => value !== "app-grid")}
              >
                <box
                  halign={Gtk.Align.FILL}
                  hexpand
                  orientation={Gtk.Orientation.VERTICAL}
                  valign={Gtk.Align.START}
                  vexpand={false}
                >
                  <AppSearch
                    searchTerm={entryText}
                    visible={launcherMode.as((value) => value === "app-search")}
                    window={value}
                    onResultClicked={(_source, app) => {
                      launch(app);
                      close();
                    }}
                    onResultsChanged={(_self, results) =>
                      setTopAppSearchResult(
                        results.reduce<
                          | {
                              readonly data: Apps.Application;
                              readonly score: number;
                            }
                          | undefined
                        >(
                          (acc, curr) =>
                            (acc?.score ?? 0) > curr.score ? acc : curr,
                          undefined,
                        )?.data,
                      )
                    }
                  />
                </box>
              </revealer>
            </box>
          )
        }
      </With>
    </PopupWindow>
  );
};
