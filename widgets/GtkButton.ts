import type { CCProps } from "ags";
import type { Gtk } from "ags/gtk4";

export type GtkButtonProps = CCProps<
  Gtk.Button,
  Partial<Gtk.Button.ConstructorProps>
>;
