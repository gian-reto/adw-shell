import Hyprland from "gi://AstalHyprland";
import { createBinding, For } from "ags";
import { Gtk } from "ags/gtk4";
import { cx } from "../../../util/cx";
import type { GtkBoxProps } from "../../../widgets/GtkBox";

const hyprland = Hyprland.get_default();

export type WorkspaceIndicatorProps = Omit<
  GtkBoxProps,
  "baselinePosition" | "orientation"
>;

export const WorkspaceIndicator = (props: WorkspaceIndicatorProps) => {
  // Props
  const { class: classOverride, ...restProps } = props;

  // State
  const currentWorkspaces = createBinding(hyprland, "workspaces").as(
    (workspaces) => workspaces.sort((a, b) => a.id - b.id),
  );

  return (
    <box
      baselinePosition={Gtk.BaselinePosition.CENTER}
      class={cx("space-x-1", classOverride)}
      orientation={Gtk.Orientation.HORIZONTAL}
      {...restProps}
    >
      <For each={currentWorkspaces}>
        {(workspace) => <Item workspaceId={workspace.id} />}
      </For>
    </box>
  );
};

type WorkspaceIndicatorItemProps = {
  /**
   * The ID of the workspace represented by the item.
   */
  workspaceId: number;
};

const Item = ({ workspaceId }: WorkspaceIndicatorItemProps) => {
  // State
  const isFocused = createBinding(hyprland, "focusedWorkspace").as(
    (workspace) => workspace.id === workspaceId,
  );

  return (
    <button
      class={cx(
        "min-h-2 p-0 rounded-full transition-sizes hover:bg-white",
        isFocused.as((value) =>
          value ? "bg-white min-w-9" : "bg-gray-200 min-w-2",
        ),
      )}
      halign={Gtk.Align.START}
      hexpand={false}
      valign={Gtk.Align.CENTER}
      vexpand={false}
      onClicked={() => {
        hyprland.message_async(`dispatch workspace ${workspaceId}`, null);
      }}
    />
  );
};
