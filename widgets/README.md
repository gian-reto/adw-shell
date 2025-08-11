# Widgets

The `/widgets` directory contains only types and aliases for built-in `Gtk` widgets. For the most part, the files here only contain type aliases for easier composition of props. In some rare cases, e.g. `/widgets/GtkMenuButton.tsx`, the file contains a wrapped `Gtk` component with a custom CSS class to override some of its default styling.

IMPORTANT: This directory DOES NOT contain any custom widgets of this shell! If you want to create a custom widget, please create it in the `/components` directory instead. The `/widgets` directory is only for slight modifications to built-in `Gtk` widgets.

## File Structure

- `/widgets/<name>.ts`: Contains a type alias for a built-in `Gtk` widget's props, e.g. `GtkButtonProps`, `GtkLabelProps`, etc. The file name should be descriptive of the widget's purpose, e.g. `GtkButton.ts`, `GtkLabel.ts`, etc. In some rare cases, the file may contain a wrapped `Gtk` component with a custom CSS class to override some of its default styling, e.g. `GtkMenuButton.tsx` exports the `GtkMenuButton` component.

Note: Files that only contain types should have a `.ts` extension, while files that contain a wrapped `Gtk` component should have a `.tsx` extension.

## Examples

```GtkBox.ts
import { CCProps } from "ags";
import { Gtk } from "ags/gtk4";

export type GtkBoxProps = CCProps<Gtk.Box, Partial<Gtk.Box.ConstructorProps>>;
```
