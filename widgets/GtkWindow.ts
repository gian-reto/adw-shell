import type { CCProps } from "ags";
import type { Astal } from "ags/gtk4";

export type GtkWindowProps = CCProps<
  Astal.Window,
  Partial<Astal.Window.ConstructorProps>
>;
