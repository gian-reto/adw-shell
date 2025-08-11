import { Gtk } from "ags/gtk4";
import { unreachable } from "./unreachable";

export type Position =
  | "center-bottom"
  | "center-center"
  | "center-top"
  | "left-bottom"
  | "left-center"
  | "left-top"
  | "right-bottom"
  | "right-center"
  | "right-top";

export const positionToAlignment = (
  position: Position
): {
  readonly halign: Gtk.Align;
  readonly valign: Gtk.Align;
} => {
  switch (position) {
    case "center-bottom":
      return { halign: Gtk.Align.CENTER, valign: Gtk.Align.END };

    case "center-center":
      return { halign: Gtk.Align.CENTER, valign: Gtk.Align.CENTER };

    case "center-top":
      return { halign: Gtk.Align.CENTER, valign: Gtk.Align.START };

    case "left-bottom":
      return { halign: Gtk.Align.START, valign: Gtk.Align.END };

    case "left-center":
      return { halign: Gtk.Align.START, valign: Gtk.Align.CENTER };

    case "left-top":
      return { halign: Gtk.Align.START, valign: Gtk.Align.START };

    case "right-bottom":
      return { halign: Gtk.Align.END, valign: Gtk.Align.END };

    case "right-center":
      return { halign: Gtk.Align.END, valign: Gtk.Align.CENTER };

    case "right-top":
      return { halign: Gtk.Align.END, valign: Gtk.Align.START };

    default:
      return unreachable(position);
  }
};
