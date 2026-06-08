import type { Gtk } from "ags/gtk4";
import Cairo from "cairo";

/**
 * Returns the {@link Cairo.Region} of the given widget within the given window.
 */
export const calculateRegion = (
  window: Gtk.Window,
  widget: Gtk.Widget,
): Cairo.Region => {
  const [, rect] = widget.compute_bounds(window);

  const region = new Cairo.Region();
  region.unionRectangle({
    x: Math.floor(rect.get_x()),
    y: Math.floor(rect.get_y()),
    width: Math.ceil(rect.get_width()),
    height: Math.ceil(rect.get_height()),
  });

  return region;
};
