import Apps from "gi://AstalApps";
import Pango from "gi://Pango";
import {
  type Accessor,
  createBinding,
  createComputed,
  createState,
  For,
  onCleanup,
} from "ags";
import { Gtk } from "ags/gtk4";
import { cx } from "../../../../util/cx";
import { debounce } from "../../../../util/debounce";
import { getIconFromNameOrPath } from "../../../../util/icon";
import type { GtkButtonProps } from "../../../../widgets/GtkButton";
import type { GtkListBoxProps } from "../../../../widgets/GtkListBox";

export type AppSearchProps = GtkListBoxProps &
  Pick<SearchResultProps, "window"> & {
    readonly searchTerm: Accessor<string>;
    readonly onResultClicked?: (
      source: Gtk.Button,
      app: Apps.Application,
    ) => void;
    readonly onResultsChanged?: (
      self: Gtk.ListBox,
      results: ReadonlyArray<Apps.Application>,
    ) => void;
  };

export const AppSearch = (props: AppSearchProps) => {
  // Props
  const {
    $,
    class: classOverride,
    onResultClicked,
    onResultsChanged,
    searchTerm,
    window,
    ...restProps
  } = props;

  // Constants
  const MAX_RESULTS = 6;
  const apps = new Apps.Apps({
    categoriesMultiplier: 0,
    descriptionMultiplier: 0.25,
    entryMultiplier: 0,
    executableMultiplier: 0.75,
    keywordsMultiplier: 0.75,
    nameMultiplier: 2.5,
  });

  // Refs
  let selfRef: Gtk.ListBox;

  // State
  const [clickCount, setClickCount] = createState(0);
  const [debouncedSearchTerm, setDebouncedSearchTerm] = createState("");
  const appsList = createBinding(apps, "list");

  // Debounced search term update.
  const updateDebouncedSearchTerm = debounce(
    (term: string) => setDebouncedSearchTerm(term),
    { waitForMs: 300, immediate: true, resetCooldown: false },
  );

  // Subscribe to search term changes and debounce them
  const searchTermUnsubscriber = searchTerm.subscribe(() => {
    updateDebouncedSearchTerm(searchTerm.peek());
  });

  const scoredApps = createComputed(() => {
    // Recompute when `clickCount` changes, to update the order based on frequency.
    clickCount();

    return new Map(
      appsList().map((app) => [
        app.name,
        {
          data: app,
          score: apps.fuzzy_score(debouncedSearchTerm(), app),
        },
      ]),
    );
  });
  const searchResults = createComputed(
    () =>
      new Map(
        [...scoredApps().values()]
          .sort((a, b) => b.score - a.score)
          .filter((app) => app.score > 0)
          .slice(0, MAX_RESULTS)
          .sort((a, b) => b.data.frequency - a.data.frequency)
          .map((app, index) => [app.data.name, index] as const),
      ),
  );

  // Handlers
  const onSearchResultsChanged = () => {
    selfRef.invalidate_sort();

    onResultsChanged?.(
      selfRef,
      [...searchResults.peek().keys()].flatMap((name) => {
        const app = scoredApps.peek().get(name);
        if (!app) return [];

        return [app.data];
      }),
    );
  };

  const searchResultsUnsubscriber = searchResults.subscribe(
    onSearchResultsChanged,
  );

  // Lifecycle
  onCleanup(() => {
    searchTermUnsubscriber();
    searchResultsUnsubscriber();
  });

  return (
    <Gtk.ListBox
      $={(self) => {
        $?.(self);

        selfRef = self;

        self.set_sort_func((a, b) => {
          const currentSearchResults = searchResults.peek();
          const aPosition =
            currentSearchResults.get(a.get_name()) ?? Number.MAX_SAFE_INTEGER;
          const bPosition =
            currentSearchResults.get(b.get_name()) ?? Number.MAX_SAFE_INTEGER;

          return aPosition - bPosition;
        });
      }}
      class={cx("bg-transparent", classOverride)}
      {...restProps}
    >
      <For each={appsList}>
        {(app) => (
          <Gtk.ListBoxRow
            class="bg-transparent p-0"
            focusable={false}
            name={app.name}
          >
            <revealer
              focusable={false}
              revealChild={searchResults.as((value) => value.has(app.name))}
            >
              <SearchResult
                app={app}
                focusable={true}
                window={window}
                onClicked={(self) => {
                  onResultClicked?.(self, app);

                  setClickCount((count) => count + 1);
                }}
              />
            </revealer>
          </Gtk.ListBoxRow>
        )}
      </For>
    </Gtk.ListBox>
  );
};

type SearchResultProps = GtkButtonProps & {
  readonly app: Apps.Application;
  /**
   * Reference of the parent window.
   */
  readonly window: Gtk.Window;
};

export const SearchResult = (props: SearchResultProps) => {
  // Props
  const { app, class: classOverride, window, ...restProps } = props;

  // Constants
  const icon = getIconFromNameOrPath(app.iconName, window, 64);

  return (
    <button
      class={cx(
        "bg-transparent px-0 py-0 rounded-2xl hover:bg-gray-950",
        classOverride,
      )}
      {...restProps}
    >
      <box class="space-x-1">
        <image
          class="gtk-icon-style-regular gtk-icon-size-5xl min-w-20 min-h-20"
          file={icon.type === "file" ? icon.path : undefined}
          halign={Gtk.Align.START}
          hexpand={false}
          paintable={icon.type === "paintable" ? icon.paintable : undefined}
          // Note: Order is important, and `iconName` must be after `file` and
          // `paintable`.
          iconName={app.iconName}
          valign={Gtk.Align.CENTER}
          vexpand={false}
        />
        <box
          class="space-y-1"
          halign={Gtk.Align.FILL}
          hexpand
          orientation={Gtk.Orientation.VERTICAL}
          valign={Gtk.Align.CENTER}
          vexpand={false}
        >
          <label
            class="font-normal text-white text-lg"
            ellipsize={Pango.EllipsizeMode.END}
            halign={Gtk.Align.START}
            hexpand
            justify={Gtk.Justification.LEFT}
            label={app.name}
            maxWidthChars={30}
            valign={Gtk.Align.CENTER}
            vexpand={false}
            wrap={false}
          />
          {app.description && (
            <label
              class="font-semibold text-gray-200 text-sm"
              ellipsize={Pango.EllipsizeMode.END}
              halign={Gtk.Align.START}
              hexpand
              justify={Gtk.Justification.LEFT}
              label={app.description}
              maxWidthChars={30}
              valign={Gtk.Align.CENTER}
              vexpand={false}
              wrap={false}
            />
          )}
        </box>
      </box>
    </button>
  );
};
