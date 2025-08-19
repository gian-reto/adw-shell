import type { CCProps } from "ags";
import type { Gtk } from "ags/gtk4";

export type GtkListBoxProps = CCProps<
  Gtk.ListBox,
  Partial<Gtk.ListBox.ConstructorProps>
>;
