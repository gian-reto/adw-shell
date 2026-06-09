import Mpris from "gi://AstalMpris";

import Gio from "gi://Gio";
import Pango from "gi://Pango";
import { createBinding, createComputed, With } from "ags";
import { Gtk } from "ags/gtk4";
import { cx } from "../../../util/cx";
import type { GtkBoxProps } from "../../../widgets/GtkBox";

type MusicPlayerProps = Omit<GtkBoxProps, "baselinePosition" | "visible">;

export const MusicPlayer = (props: MusicPlayerProps) => {
  // Constants
  const mpris = Mpris.get_default();

  // State
  const players = createBinding(mpris, "players");
  const currentPlayer = createComputed(
    () =>
      players()
        .flatMap((player) => {
          const available = createBinding(player, "available");
          const canControl = createBinding(player, "canControl");

          if (!available() || !canControl()) return [];

          const playbackStatus = createBinding(player, "playbackStatus");

          return [
            {
              player,
              playbackStatus: playbackStatus(),
            },
          ];
        })
        .sort((a, b) => {
          const getPriority = (status: Mpris.PlaybackStatus) => {
            switch (status) {
              case Mpris.PlaybackStatus.PLAYING:
                return 0;

              case Mpris.PlaybackStatus.PAUSED:
                return 1;

              case Mpris.PlaybackStatus.STOPPED:
                return 2;
            }
          };

          return getPriority(a.playbackStatus) - getPriority(b.playbackStatus);
        })
        .at(0)?.player,
  );

  return (
    <box
      visible={currentPlayer.as<boolean>((value) => value !== undefined)}
      {...props}
    >
      <With value={currentPlayer}>
        {(value) => value && <MusicPlayerBox player={value} />}
      </With>
    </box>
  );
};

type MusicPlayerBoxProps = Omit<GtkBoxProps, "baselinePosition" | "visible"> & {
  readonly player: Mpris.Player;
};

const MusicPlayerBox = (props: MusicPlayerBoxProps) => {
  // Props
  const { class: classOverride, player, ...restProps } = props;

  // State
  const artist = createBinding(player, "artist");
  const canGoNext = createBinding(player, "canGoNext");
  const canGoPrevious = createBinding(player, "canGoPrevious");
  const canPause = createBinding(player, "canPause");
  const canPlay = createBinding(player, "canPlay");
  const canPlayOrPause = createComputed(() => canPlay() || canPause());
  const coverArt = createBinding(player, "coverArt");
  const playbackStatus = createBinding(player, "playbackStatus");
  const title = createBinding(player, "title");

  return (
    <box
      class={cx(
        "bg-gray-400 duration-100 p-3 pr-5 rounded-xl shadow-sm space-x-3",
        classOverride,
      )}
      baselinePosition={Gtk.BaselinePosition.CENTER}
      hexpand
      vexpand={false}
      {...restProps}
    >
      <box
        halign={Gtk.Align.START}
        hexpand={false}
        valign={Gtk.Align.CENTER}
        vexpand={false}
      >
        <With value={coverArt}>
          {(coverArt) => (
            <box
              class="bg-gray-500 rounded-lg shadow-sm"
              css={getCoverArtStylesheet(coverArt)}
              heightRequest={56}
              overflow={Gtk.Overflow.HIDDEN}
              widthRequest={56}
            />
          )}
        </With>
      </box>
      <box
        class="space-y-0.5"
        halign={Gtk.Align.START}
        hexpand
        orientation={Gtk.Orientation.VERTICAL}
        valign={Gtk.Align.CENTER}
        vexpand={false}
      >
        <label
          class="font-semibold text-white"
          ellipsize={Pango.EllipsizeMode.END}
          halign={Gtk.Align.START}
          justify={Gtk.Justification.LEFT}
          label={title.as<string>((value) => value || "Unknown title")}
          lines={1}
          maxWidthChars={14}
          valign={Gtk.Align.CENTER}
          vexpand={false}
        />
        <label
          class="text-md text-gray-50"
          ellipsize={Pango.EllipsizeMode.END}
          halign={Gtk.Align.START}
          justify={Gtk.Justification.LEFT}
          label={artist.as<string>((value) => value || "Unknown artist")}
          lines={1}
          maxWidthChars={14}
          valign={Gtk.Align.CENTER}
          vexpand={false}
        />
      </box>
      <box
        class="space-x-2"
        halign={Gtk.Align.END}
        hexpand={false}
        valign={Gtk.Align.CENTER}
        vexpand={false}
      >
        <button
          class="bg-transparent min-h-6 min-w-6 p-1.5 rounded-full disabled:text-gray-100 hover:bg-gray-300"
          halign={Gtk.Align.START}
          hexpand={false}
          valign={Gtk.Align.CENTER}
          vexpand={false}
          sensitive={canGoPrevious}
          onClicked={() => player.previous()}
        >
          <image iconName="media-skip-backward-symbolic" />
        </button>
        <button
          class="bg-transparent min-h-6 min-w-6 p-1.5 rounded-full disabled:text-gray-100 hover:bg-gray-300"
          halign={Gtk.Align.START}
          hexpand={false}
          valign={Gtk.Align.CENTER}
          vexpand={false}
          sensitive={canPlayOrPause}
          onClicked={() => player.play_pause()}
        >
          <image
            iconName={playbackStatus.as<string>((value) =>
              value === Mpris.PlaybackStatus.PLAYING
                ? "media-playback-pause-symbolic"
                : "media-playback-start-symbolic",
            )}
          />
        </button>
        <button
          class="bg-transparent min-h-6 min-w-6 p-1.5 rounded-full disabled:text-gray-100 hover:bg-gray-300"
          halign={Gtk.Align.START}
          hexpand={false}
          valign={Gtk.Align.CENTER}
          vexpand={false}
          sensitive={canGoNext}
          onClicked={() => player.next()}
        >
          <image iconName="media-skip-forward-symbolic" />
        </button>
      </box>
    </box>
  );
};

const getCoverArtStylesheet = (coverArt: string): string => {
  if (!coverArt) return "";

  const uri = Gio.File.new_for_path(coverArt).get_uri();

  return `background-image: url("${uri}"); background-position: center; background-repeat: no-repeat; background-size: cover;`;
};
