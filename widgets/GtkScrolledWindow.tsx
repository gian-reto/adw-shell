import { CCProps } from "ags";
import { Gtk } from "ags/gtk4";
import { cx } from "../util/cx";

export type GtkScrolledWindowProps = CCProps<
  Gtk.ScrolledWindow,
  Partial<Gtk.ScrolledWindow.ConstructorProps>
>;

export const GtkScrolledWindow = (props: GtkScrolledWindowProps) => {
  const { class: classOverride, ...restProps } = props;

  return (
    <scrolledwindow
      class={cx("gtk-scrolled-window", classOverride)}
      {...restProps}
    />
  );
};
