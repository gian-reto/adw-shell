import { CCProps } from "ags";
import { Gtk } from "ags/gtk4";

export type GtkButtonProps = CCProps<
  Gtk.Button,
  Partial<Gtk.Button.ConstructorProps>
>;
