import { CCProps } from "ags";
import { Gtk } from "ags/gtk4";
import { cx } from "../util/cx";

export type GtkCalendarProps = CCProps<
  Gtk.Calendar,
  Partial<Gtk.Calendar.ConstructorProps>
>;

export const GtkCalendar = (props: GtkCalendarProps) => {
  const { class: classOverride, ...restProps } = props;

  return (
    <Gtk.Calendar class={cx("gtk-calendar", classOverride)} {...restProps} />
  );
};
