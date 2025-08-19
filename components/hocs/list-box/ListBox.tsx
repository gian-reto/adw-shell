import type { Accessor } from "ags";
import { Gtk } from "ags/gtk4";
import { cx } from "../../../util/cx";
import type { GtkBoxProps } from "../../../widgets/GtkBox";
import type { GtkListBoxProps } from "../../../widgets/GtkListBox";
import type { GtkListBoxRowProps } from "../../../widgets/GtkListBoxRow";

export type ListBoxProps = Omit<GtkBoxProps, "orientation"> &
  Pick<
    GtkListBoxProps,
    | "acceptUnpairedRelease"
    | "activateOnSingleClick"
    | "selectionMode"
    | "showSeparators"
    | "tabBehavior"
  > & {
    readonly subtitle?: string | Accessor<string>;
    readonly title?: string | Accessor<string>;
  };

const ListBox = (props: ListBoxProps) => {
  // Props
  const {
    acceptUnpairedRelease,
    activateOnSingleClick,
    children,
    class: classOverride,
    selectionMode,
    showSeparators,
    subtitle,
    tabBehavior,
    title,
    ...restProps
  } = props;

  return (
    <box
      class={cx("space-y-3", classOverride)}
      orientation={Gtk.Orientation.VERTICAL}
      {...restProps}
    >
      {(title || subtitle) && (
        <box class="space-y-0.5" orientation={Gtk.Orientation.VERTICAL}>
          {title && (
            <label
              class="font-semibold text-white text-sm"
              halign={Gtk.Align.START}
              label={title}
            />
          )}
          {subtitle && (
            <label
              class="font-normal text-gray-100 text-sm"
              halign={Gtk.Align.START}
              label={subtitle}
            />
          )}
        </box>
      )}
      <Gtk.ListBox
        acceptUnpairedRelease={acceptUnpairedRelease}
        activateOnSingleClick={activateOnSingleClick}
        class="bg-transparent divide-y divide-gray-700 rounded-xl shadow-md"
        overflow={Gtk.Overflow.HIDDEN}
        selectionMode={selectionMode}
        showSeparators={showSeparators}
        tabBehavior={tabBehavior}
      >
        {children}
      </Gtk.ListBox>
    </box>
  );
};

export type ListBoxItemProps = GtkListBoxRowProps;

const ListBoxItem = (props: ListBoxItemProps) => {
  const { children, class: classOverride, ...restProps } = props;

  return (
    <Gtk.ListBoxRow
      class={cx(
        "bg-gray-500 first-child:rounded-t-xl last-child:rounded-b-xl px-4 py-4",
        classOverride,
      )}
      {...restProps}
    >
      {children}
    </Gtk.ListBoxRow>
  );
};

ListBox.Item = ListBoxItem;
export { ListBox };
