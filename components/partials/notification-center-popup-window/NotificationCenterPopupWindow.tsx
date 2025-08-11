import { Astal, Gtk } from "ags/gtk4";
import {
  PopupWindow,
  PopupWindowProps,
} from "../../hocs/popup-window/PopupWindow";
import { With, createState } from "ags";

import { NotificationCenter } from "../../organisms/notification-center/NotificationCenter";
import { cx } from "../../../util/cx";

export type NotificationCenterPopupWindowProps = Omit<
  PopupWindowProps,
  "exclusivity" | "name" | "position"
>;

export const NotificationCenterPopupWindow = (
  props: NotificationCenterPopupWindowProps
) => {
  // Props
  const { $, ...restProps } = props;

  // State
  const [window, setWindow] = createState<Astal.Window | undefined>(undefined);

  return (
    <PopupWindow
      $={(self) => {
        $?.(self);

        setWindow(self);
      }}
      exclusivity={Astal.Exclusivity.EXCLUSIVE}
      name="notification-center"
      position="center-top"
      {...restProps}
    >
      <box
        class={cx(
          "bg-gray-600 border border-gray-500 mt-1.5",
          // Margins to prevent shadow clipping.
          "ml-6 mr-6 mb-6",
          "rounded-3xl shadow-xl shadow-black"
        )}
        overflow={Gtk.Overflow.HIDDEN}
      >
        <With value={window}>
          {(value) => value && <NotificationCenter window={value} />}
        </With>
      </box>
    </PopupWindow>
  );
};
