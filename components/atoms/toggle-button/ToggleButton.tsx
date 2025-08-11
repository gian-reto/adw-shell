import {
  Accessor,
  Node,
  State,
  With,
  createState,
  onCleanup,
  onMount,
} from "ags";
import { Astal, Gdk, Gtk } from "ags/gtk4";
import { ClickableBox, ClickableBoxProps } from "../clickable-box/ClickableBox";

import { GtkBoxProps } from "../../../widgets/GtkBox";
import { GtkImageProps } from "../../../widgets/GtkImage";
import { GtkLabelProps } from "../../../widgets/GtkLabel";
import { GtkRevealerProps } from "../../../widgets/GtkRevealer";
import Pango from "gi://Pango";
import { cx } from "../../../util/cx";

export type ToggleButtonProps = Omit<GtkBoxProps, "children"> & {
  readonly iconName: string | Accessor<string>;
  readonly isActive?: boolean | Accessor<boolean>;
  readonly isExpandable?: boolean | Accessor<boolean>;
  readonly isExpanded?: boolean | Accessor<boolean>;
  readonly label: string | Accessor<string>;
  readonly onClicked?: (self: Gtk.Box) => void;
  readonly onCollapsed?: (self: Gtk.Box) => void;
  readonly onExpanded?: (self: Gtk.Box) => void;
};

export const ToggleButton = (props: ToggleButtonProps) => {
  // Props
  const {
    iconName,
    isActive: isActiveOverride = false,
    isExpandable: isExpandableOverride = false,
    isExpanded: isExpandedOverride = false,
    label: labelOverride,
    onClicked,
    onCollapsed,
    onExpanded,
    ...restProps
  } = props;

  // Refs
  let isExpandedOverrideUnsubscriber: (() => void) | undefined;

  // State
  const label =
    typeof labelOverride === "string"
      ? new Accessor(() => labelOverride)
      : labelOverride;
  const isActive =
    typeof isActiveOverride === "boolean"
      ? new Accessor(() => isActiveOverride)
      : isActiveOverride;
  const isExpandable =
    typeof isExpandableOverride === "boolean"
      ? new Accessor(() => isExpandableOverride)
      : isExpandableOverride;
  const [isExpanded, setExpanded] = createState(
    typeof isExpandedOverride === "boolean" ? isExpandedOverride : false
  );

  // Lifecycle
  onMount(() => {
    if (typeof isExpandedOverride !== "boolean") {
      isExpandedOverrideUnsubscriber = isExpandedOverride.subscribe(() => {
        setExpanded(isExpandedOverride.get());
      });
    }
  });

  onCleanup(() => {
    isExpandedOverrideUnsubscriber?.();
  });

  return (
    <box {...restProps}>
      <ClickableBox
        class={cx(
          "min-w-24 pl-5 pr-4 py-4 space-x-3 transition-colors",
          isActive.as((value) =>
            value
              ? "bg-primary-3 hover:bg-primary-2"
              : "bg-gray-500 hover:bg-gray-400"
          ),
          isExpandable.as((value) =>
            value ? "rounded-l-full" : "rounded-full"
          )
        )}
        halign={Gtk.Align.FILL}
        hexpand
        valign={Gtk.Align.FILL}
        vexpand={false}
        onClicked={onClicked}
      >
        <image
          halign={Gtk.Align.START}
          hexpand={false}
          iconName={iconName}
          valign={Gtk.Align.CENTER}
          vexpand={false}
        />
        <label
          class="font-semibold text-white text-sm"
          ellipsize={Pango.EllipsizeMode.END}
          halign={Gtk.Align.START}
          hexpand
          label={label}
          maxWidthChars={isExpandable((value) => (value ? 8 : 14))}
          valign={Gtk.Align.CENTER}
          vexpand={false}
        />
      </ClickableBox>
      <With value={isExpandable}>
        {(value) =>
          value && (
            <ClickableBox
              class={cx(
                "border-l px-3 py-4 rounded-r-full transition-colors",
                isActive.as((active) =>
                  active
                    ? "bg-primary-2 border-primary-1 hover:bg-primary-1"
                    : "bg-gray-400 border-gray-300 hover:bg-gray-300"
                )
              )}
              halign={Gtk.Align.END}
              hexpand={false}
              valign={Gtk.Align.FILL}
              vexpand={false}
              onClicked={(self) => {
                const newExpandedState = !isExpanded.get();

                setExpanded(newExpandedState);

                if (newExpandedState) {
                  onExpanded?.(self);
                } else {
                  onCollapsed?.(self);
                }
              }}
            >
              <image
                halign={Gtk.Align.CENTER}
                hexpand={false}
                iconName="go-next-symbolic"
                valign={Gtk.Align.CENTER}
                vexpand={false}
              />
            </ClickableBox>
          )
        }
      </With>
    </box>
  );
};

export type ToggleButtonMenuProps = Omit<GtkRevealerProps, "transitionType"> & {
  /**
   * An additional footer widget, separated from the main content by a
   * separator.
   */
  readonly footer?: Node | Node[];
  /**
   * Icon name for the menu's header bar.
   */
  readonly iconName: NonNullable<GtkImageProps["iconName"]>;
  /**
   * Whether the associated toggle button is active. Defaults to `false`.
   */
  readonly isActive?: boolean | Accessor<boolean>;
  /**
   * Whether to show a loading spinner next to the title. Defaults to `false`.
   */
  readonly isLoading?: boolean | Accessor<boolean>;
  /**
   * Menu header bar title.
   */
  readonly title: NonNullable<GtkLabelProps["label"]>;
};

const ToggleButtonMenu = (props: ToggleButtonMenuProps) => {
  // Props
  const {
    children,
    footer,
    iconName,
    isActive: isActiveOverride = false,
    isLoading: isLoadingOverride = false,
    title,
    ...restProps
  } = props;

  // State
  const isActive =
    typeof isActiveOverride === "boolean"
      ? new Accessor(() => isActiveOverride)
      : isActiveOverride;
  const isLoading =
    typeof isLoadingOverride === "boolean"
      ? new Accessor(() => isLoadingOverride)
      : isLoadingOverride;

  return (
    <revealer
      transitionType={Gtk.RevealerTransitionType.SLIDE_DOWN}
      {...restProps}
    >
      <box
        class="bg-gray-400 mt-3 p-0 rounded-3xl space-y-3"
        orientation={Gtk.Orientation.VERTICAL}
        overflow={Gtk.Overflow.HIDDEN}
      >
        <box class="pt-3 px-3 space-x-3">
          <box
            class={cx(
              "rounded-full p-2",
              isActive.as((active) => (active ? "bg-primary-3" : "bg-gray-300"))
            )}
            halign={Gtk.Align.START}
            hexpand={false}
            valign={Gtk.Align.CENTER}
            vexpand={false}
          >
            <image
              class="text-2xl"
              halign={Gtk.Align.CENTER}
              hexpand={false}
              iconName={iconName}
              valign={Gtk.Align.CENTER}
              vexpand={false}
            />
          </box>
          <label
            class="font-bold text-white text-xl"
            halign={Gtk.Align.START}
            hexpand={false}
            label={title}
            valign={Gtk.Align.CENTER}
            vexpand={false}
          />
          <box
            halign={Gtk.Align.FILL}
            hexpand
            valign={Gtk.Align.CENTER}
            vexpand={false}
          >
            <Gtk.Spinner
              class="text-white"
              halign={Gtk.Align.START}
              hexpand={false}
              spinning={isLoading}
              valign={Gtk.Align.CENTER}
              vexpand={false}
              visible={isLoading}
            />
          </box>
        </box>
        <box class="px-3 pb-3" orientation={Gtk.Orientation.VERTICAL}>
          <>
            {children}
            {footer && (
              <box class="pt-2" orientation={Gtk.Orientation.VERTICAL}>
                <>
                  <Gtk.Separator
                    class="mb-2 mx-2.5"
                    orientation={Gtk.Orientation.HORIZONTAL}
                  />
                  {footer}
                </>
              </box>
            )}
          </>
        </box>
      </box>
    </revealer>
  );
};

export type ToggleButtonMenuItemProps = ClickableBoxProps;

const ToggleButtonMenuItem = (props: ToggleButtonMenuItemProps) => {
  const { class: classOverride, children, ...restProps } = props;

  return (
    <ClickableBox
      class={cx(
        "bg-gray-400 px-3 py-2 rounded-xl transition-colors hover:bg-gray-300",
        classOverride
      )}
      {...restProps}
    >
      {children}
    </ClickableBox>
  );
};

ToggleButtonMenu.Item = ToggleButtonMenuItem;
export { ToggleButtonMenu };
