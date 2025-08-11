import { CCProps } from "ags";
import { Gtk } from "ags/gtk4";
import { cx } from "../util/cx";

export type GtkMenuButtonProps = CCProps<
  Gtk.MenuButton,
  Partial<Gtk.MenuButton.ConstructorProps>
>;

export const GtkMenuButton = (props: GtkMenuButtonProps) => {
  const { class: classOverride, ...restProps } = props;

  return (
    <menubutton class={cx("gtk-menu-button", classOverride)} {...restProps} />
  );
};
