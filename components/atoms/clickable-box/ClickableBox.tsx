import { onCleanup } from "ags";
import { Gtk } from "ags/gtk4";
import type { GtkBoxProps } from "../../../widgets/GtkBox";

export type ClickableBoxProps = GtkBoxProps & {
  /**
   * Function called when the user clicks the box.
   */
  readonly onClicked?: (self: Gtk.Box) => void;
};

export const ClickableBox = (props: ClickableBoxProps) => {
  // Props
  const { $, onClicked, ...restProps } = props;

  // Event controller
  const gesture = new Gtk.GestureClick();
  const id = gesture.connect("released", (gesture) => {
    if (onClicked !== undefined) {
      gesture.set_state(Gtk.EventSequenceState.CLAIMED);

      onClicked(gesture.get_widget() as Gtk.Box);
    }
  });

  // Lifecycle
  onCleanup(() => {
    gesture.disconnect(id);
  });

  return (
    <box
      $={(self) => {
        $?.(self);

        self.add_controller(gesture);
      }}
      {...restProps}
    />
  );
};
