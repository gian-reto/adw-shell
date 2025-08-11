import {
  Accessor,
  With,
  createBinding,
  createComputed,
  createState,
  onCleanup,
  onMount,
} from "ags";

import { Gtk } from "ags/gtk4";
import { GtkBoxProps } from "../../../widgets/GtkBox";
import Mpris from "gi://AstalMpris";
import Pango from "gi://Pango";
import { cx } from "../../../util/cx";

type MusicPlayerProps = Omit<GtkBoxProps, "baselinePosition" | "visible">;

export const MusicPlayer = (props: MusicPlayerProps) => {
  // Constants
  const mpris = Mpris.get_default();

  // State
  const [currentPlayer, setCurrentPlayer] = createState<
    Mpris.Player | undefined
  >(undefined);

  // Handlers
  const onPlayersChanged = () => {
    const availablePlayers = mpris
      .get_players()
      .filter((player) => player.available && player.canControl);

    const player =
      availablePlayers.find(
        (player) => player.playbackStatus === Mpris.PlaybackStatus.PLAYING
      ) ??
      availablePlayers.find(
        (player) => player.playbackStatus === Mpris.PlaybackStatus.PAUSED
      );

    if (player) {
      if (player !== currentPlayer.get()) {
        setCurrentPlayer(player);
      }
    } else {
      setCurrentPlayer(undefined);
    }
  };

  // Subscribe to player changes.
  const notifyPlayersHandlerId = mpris.connect(
    "notify::players",
    onPlayersChanged
  );

  // Lifecycle
  onMount(() => {
    // Initially set the player state.
    onPlayersChanged();
  });

  onCleanup(() => {
    mpris.disconnect(notifyPlayersHandlerId);
  });

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
  const canPlayOrPause = createComputed(
    [canPlay, canPause],
    (canPlay, canPause) => {
      return canPlay || canPause;
    }
  );
  const coverArt = createBinding(player, "coverArt");
  const playbackStatus = createBinding(player, "playbackStatus");
  const title = createBinding(player, "title");

  return (
    <box
      class={cx(
        "bg-gray-400 duration-100 p-3 pr-5 rounded-xl shadow-sm space-x-3",
        classOverride
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
          {(coverArt) =>
            !!coverArt ? (
              <image
                class="bg-gray-500 min-w-14 min-h-14 rounded-lg shadow-sm"
                file={coverArt}
                overflow={Gtk.Overflow.HIDDEN}
              />
            ) : (
              <box class="bg-gray-500 min-w-14 min-h-14 rounded-lg" />
            )
          }
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
                : "media-playback-start-symbolic"
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
