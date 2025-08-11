import { createBinding, onCleanup, onMount } from "ags";

import { Gtk } from "ags/gtk4";
import { GtkBoxProps } from "../../../../widgets/GtkBox";
import Wireplumber from "gi://AstalWp";
import { cx } from "../../../../util/cx";

export type VolumeSliderProps = GtkBoxProps;

export const VolumeSlider = (props: VolumeSliderProps) => {
  // Props
  const { class: classOverride, ...restProps } = props;

  // Constants
  const wireplumber = Wireplumber.get_default();

  // Refs
  let scaleRef: Gtk.Scale;
  let volumeUnsubscriber: (() => void) | undefined;

  // State
  const volume = createBinding(wireplumber.defaultSpeaker, "volume");
  const volumeIcon = createBinding(wireplumber.defaultSpeaker, "volumeIcon");

  // Handlers
  const onVolumeChanged = () => {
    if (volume === undefined) {
      scaleRef.set_value(0);
      return;
    }

    scaleRef.set_value(volume.get());
  };

  // Lifecycle
  onMount(() => {
    volumeUnsubscriber = volume.subscribe(onVolumeChanged);
  });

  onCleanup(() => {
    volumeUnsubscriber?.();
  });

  return (
    <box class={cx("space-x-2", classOverride)} {...restProps}>
      <image
        halign={Gtk.Align.START}
        hexpand={false}
        iconName={volumeIcon}
        valign={Gtk.Align.CENTER}
        vexpand={false}
      />
      <Gtk.Scale
        $={(self) => {
          scaleRef = self;

          self.set_range(0, 1);
        }}
        class="gtk-scale p-0"
        halign={Gtk.Align.FILL}
        hexpand
        onValueChanged={(self) => {
          if (!wireplumber) return;

          wireplumber.defaultSpeaker.set_volume(self.get_value());
        }}
        valign={Gtk.Align.CENTER}
        vexpand={false}
      />
    </box>
  );
};
