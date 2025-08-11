import { Accessor, createComputed, createState } from "ags";
import { Astal, Gdk, Gtk } from "ags/gtk4";
import { Position, positionToAlignment } from "../../../util/position";

import Graphene from "gi://Graphene";
import { GtkBoxProps } from "../../../widgets/GtkBox";
import { GtkRevealerProps } from "../../../widgets/GtkRevealer";
import { GtkWindowProps } from "../../../widgets/GtkWindow";
import app from "ags/gtk4/app";
import { cx } from "../../../util/cx";
import { unreachable } from "../../../util/unreachable";

export type PopupWindowProps = Omit<
  GtkWindowProps,
  "anchor" | "application" | "name"
> &
  Pick<
    ContentBoxProps,
    | "onConcealed"
    | "onRevealed"
    | "position"
    | "revealChild"
    | "transitionDuration"
  > & {
    /**
     * Unique name of the window.
     */
    readonly name: NonNullable<GtkWindowProps["name"]>;
  };

/**
 * Wraps the given `child` component in a `window` widget with the given `name`,
 * and allows the window to be easily positioned, as well as toggled using an
 * animation.
 */
export const PopupWindow = (props: PopupWindowProps) => {
  // Props
  const {
    $,
    children,
    class: classOverride,
    exclusivity = Astal.Exclusivity.IGNORE,
    name,
    onNotifyVisible,
    position,
    transitionDuration,
    ...restProps
  } = props;

  // Constants
  const { BOTTOM, LEFT, RIGHT, TOP } = Astal.WindowAnchor;

  // Refs
  let contentBoxRef: Gtk.Box;
  let windowRef: Astal.Window;

  // State
  const [isVisible, setVisible] = createState(false);

  // Handlers
  const handleKeyPressed = (
    _event: Gtk.EventControllerKey,
    keyval: number
  ): boolean => {
    if (keyval === Gdk.KEY_Escape) {
      windowRef.hide();
      return true;
    }

    return false;
  };

  const handlePressed = (
    _event: Gtk.GestureClick,
    _count: number,
    x: number,
    y: number
  ): boolean => {
    const [, rect] = contentBoxRef.compute_bounds(windowRef);
    const position = new Graphene.Point({ x, y });

    if (!rect.contains_point(position)) {
      setVisible(false);
      return true;
    }

    return false;
  };

  return (
    <window
      $={(self) => {
        $?.(self);

        windowRef = self;
      }}
      anchor={BOTTOM | LEFT | RIGHT | TOP}
      application={app}
      class={cx("bg-transparent", classOverride)}
      exclusivity={exclusivity}
      keymode={Astal.Keymode.ON_DEMAND}
      layer={Astal.Layer.TOP}
      name={name}
      onNotifyVisible={(source, pspec) => {
        onNotifyVisible?.(source, pspec);

        setVisible(source.visible);
      }}
      {...restProps}
    >
      <Gtk.EventControllerKey onKeyPressed={handleKeyPressed} />
      <Gtk.GestureClick onPressed={handlePressed} />

      <ContentBox
        $={(self) => {
          contentBoxRef = self;
        }}
        onConcealed={() => {
          windowRef.hide();
        }}
        onRevealed={() => {
          windowRef.show();
        }}
        position={position}
        revealChild={isVisible}
        transitionDuration={transitionDuration}
      >
        {children}
      </ContentBox>
    </window>
  );
};

type ContentBoxProps = Omit<GtkBoxProps, "halign" | "valign"> &
  Pick<
    PopupRevealerProps,
    "onConcealed" | "onRevealed" | "revealChild" | "transitionDuration"
  > & {
    readonly position: Position | Accessor<Position>;
  };

const ContentBox = (props: ContentBoxProps) => {
  // Props
  const {
    children,
    onConcealed,
    onRevealed,
    position: positionOverride,
    revealChild,
    transitionDuration,
    ...restProps
  } = props;

  // State
  const popupPosition =
    positionOverride instanceof Accessor
      ? positionOverride
      : new Accessor(() => positionOverride);
  const alignment = createComputed([popupPosition], (value) =>
    positionToAlignment(value)
  );
  const halign = createComputed([alignment], (value) => value.halign);
  const valign = createComputed([alignment], (value) => value.valign);

  return (
    <box
      halign={halign}
      orientation={Gtk.Orientation.VERTICAL}
      valign={valign}
      {...restProps}
    >
      <PopupRevealer
        onConcealed={onConcealed}
        onRevealed={onRevealed}
        popupPosition={popupPosition}
        revealChild={revealChild}
        transitionDuration={transitionDuration}
      >
        {children}
      </PopupRevealer>
    </box>
  );
};

const positionToRevealerTransitionType = (
  position: Position
): Gtk.RevealerTransitionType => {
  switch (position) {
    case "center-bottom":
    case "left-bottom":
    case "right-bottom":
      return Gtk.RevealerTransitionType.SLIDE_UP;

    case "center-center":
      return Gtk.RevealerTransitionType.CROSSFADE;

    case "center-top":
    case "left-top":
    case "right-top":
      return Gtk.RevealerTransitionType.SLIDE_DOWN;

    case "left-center":
      return Gtk.RevealerTransitionType.SLIDE_RIGHT;

    case "right-center":
      return Gtk.RevealerTransitionType.SLIDE_LEFT;

    default:
      return unreachable(position);
  }
};

type PopupRevealerProps = Omit<GtkRevealerProps, "transitionType"> & {
  readonly onConcealed?: () => void;
  readonly onRevealed?: () => void;
  readonly popupPosition: Accessor<Position>;
};

const PopupRevealer = (props: PopupRevealerProps) => {
  // Props
  const {
    onConcealed,
    onRevealed,
    popupPosition,
    transitionDuration = 200,
    ...restProps
  } = props;

  // State
  const transitionType = createComputed([popupPosition], (value) =>
    positionToRevealerTransitionType(value)
  );

  return (
    <revealer
      transitionDuration={transitionDuration}
      transitionType={transitionType}
      onNotifyChildRevealed={({ childRevealed }) => {
        if (childRevealed) {
          onRevealed?.();
        } else {
          onConcealed?.();
        }
      }}
      {...restProps}
    />
  );
};
