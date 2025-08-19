import Cairo from "gi://cairo";
import type { Gtk } from "ags/gtk4";

/**
 * Returns the {@link Cairo.Region} of the given widget within the given window.
 */
export const calculateRegion = (
  window: Gtk.Window,
  widget: Gtk.Widget,
): Cairo.Region => {
  const [, rect] = widget.compute_bounds(window);

  const region = new Cairo.Region();
  // `unionRectangle` exists but is somehow not typed.
  (region as any).unionRectangle(
    new Cairo.Rectangle({
      x: rect.get_x(),
      y: rect.get_y(),
      width: rect.get_width(),
      height: rect.get_height(),
    }),
  );

  return region;
};
