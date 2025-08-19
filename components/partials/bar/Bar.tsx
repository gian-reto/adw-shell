import { Accessor, createBinding, createComputed } from "ags";
import { Astal, Gtk } from "ags/gtk4";

import { ClickableBox } from "../../atoms/clickable-box/ClickableBox";
import type GObject from "ags/gobject";
import type { GtkWindowProps } from "../../../widgets/GtkWindow";
import Network from "gi://AstalNetwork";
import { Tray } from "../../molecules/tray/Tray";
import Wireplumber from "gi://AstalWp";
import { WorkspaceIndicator } from "../../atoms/workspace-indicator/WorkspaceIndicator";
import app from "ags/gtk4/app";
import { createBindingDeep } from "../../../util/binding";
import { createPoll } from "ags/time";
import { cx } from "../../../util/cx";
import { getIconNameForNetworkClient } from "../../../util/network-manager";

export type BarProps = Omit<
  GtkWindowProps,
  "anchor" | "application" | "exclusivity" | "gdkmonitor" | "visible"
> & {
  /**
   * The monitor where the window is displayed.
   */
  readonly gdkmonitor: NonNullable<GtkWindowProps["gdkmonitor"]>;
};

export default function Bar(props: BarProps): GObject.Object {
  // Props
  const { class: classOverride, gdkmonitor, name, ...restProps } = props;

  // Constants
  const { TOP, LEFT, RIGHT } = Astal.WindowAnchor;
  const network = Network.get_default();
  const wireplumber = Wireplumber.get_default();

  // State
  const dateTime = createPoll("", 1000, 'date --iso-8601="minutes"');
  const networkClientConnectivity = createBindingDeep(
    network,
    "client.connectivity",
  );
  const networkClientPrimaryConnection = createBindingDeep(
    network,
    "client.primaryConnection",
  );
  const networkIcon = createComputed(
    [networkClientConnectivity, networkClientPrimaryConnection],
    (connectivity, primaryConnection) =>
      getIconNameForNetworkClient({ connectivity, primaryConnection }),
  );
  const speakerIcon = createComputed(
    [
      createBinding(wireplumber.defaultSpeaker, "mute"),
      createBinding(wireplumber.defaultSpeaker, "volumeIcon"),
    ],
    (mute, volumeIcon) => (mute ? "audio-volume-muted-symbolic" : volumeIcon),
  );
  const microphoneIcon = createComputed(
    [createBinding(wireplumber.defaultMicrophone, "mute")],
    (mute) =>
      mute
        ? "microphone-disabled-symbolic"
        : "microphone-sensitivity-high-symbolic",
  );

  return (
    <window
      anchor={TOP | LEFT | RIGHT}
      application={app}
      class={cx("bg-black text-white", classOverride)}
      exclusivity={Astal.Exclusivity.EXCLUSIVE}
      gdkmonitor={gdkmonitor}
      name={name ?? "bar"}
      visible
      {...restProps}
    >
      <centerbox cssName="centerbox">
        <WorkspaceIndicator
          $type="start"
          class="pl-3"
          halign={Gtk.Align.START}
          hexpand={false}
          valign={Gtk.Align.CENTER}
          vexpand={false}
        />

        <button
          $type="center"
          class="bg-transparent font-bold my-0.5 px-3 py-0.5 rounded-full text-sm text-white hover:bg-gray-800"
          halign={Gtk.Align.CENTER}
          hexpand={false}
          label={dateTime.as((value) =>
            new Date(value).toLocaleTimeString(undefined, {
              month: "short",
              day: "numeric",
              hour: "2-digit",
              hour12: false,
              minute: "2-digit",
            }),
          )}
          valign={Gtk.Align.CENTER}
          vexpand={false}
          onClicked={() => app.toggle_window("notification-center")}
        />

        <box
          $type="end"
          class="pr-1.5 space-x-4"
          halign={Gtk.Align.END}
          hexpand={false}
        >
          <Tray
            halign={Gtk.Align.END}
            hexpand={false}
            valign={Gtk.Align.CENTER}
            vexpand={false}
          />

          <ClickableBox
            class="bg-transparent my-0.5 px-3 py-1.5 rounded-full space-x-3 hover:bg-gray-800"
            halign={Gtk.Align.END}
            hexpand={false}
            valign={Gtk.Align.CENTER}
            vexpand={false}
            onClicked={() => app.toggle_window("control-center")}
          >
            <image iconName={networkIcon} />
            <image iconName={speakerIcon} />
            <image iconName={microphoneIcon} />
            <image iconName="system-shutdown-symbolic" />
          </ClickableBox>
        </box>
      </centerbox>
    </window>
  );
}
