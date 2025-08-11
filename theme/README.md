# Theme

The `/theme` directory contains all SCSS styles of the entire shell. At the core, it's designed to provide reusable utility classes modelled after Tailwind CSS, which can be used to inline style definitions directly in the respective JSX components.

IMPORTANT: This stylesheet is used in GTK, so it's NOT always the same as regular CSS / Sass! Some properties are not implemented in GTK, because they do not make sense in a GTK context (e.g. `flex`). For example, sizing or aligning components in GTK is done directly in JSX using component properties like `halign`, `valign`, `hexpand`, `vexpand`, etc., NOT CSS. The avaliable CSS properties are listed in the [GTK 4 CSS Properties documentation](https://docs.gtk.org/gtk4/css-properties.html). Before adding a style property to some CSS file, check first if it is actually supported by GTK.

## File Structure

- `/theme/base/<theme-name>.scss`: Contains a file for each usable theme, each of which contains the base design tokens for the respective theme as CSS variables.
  - `/theme/base/adwaita-dark.scss`: Contains the design tokens for the Adwaita Dark theme. This is currently the only available theme.
- `/theme/components/<component-name>.scss`: Contains styling for entire custom components. This should only be used for styles that cannot be expressed with utility classes, and is currently almost empty.
- `/theme/utils/<utility-name>.scss`: Contains utility classes that can be used to style components.
  - `/theme/utils/borders.scss`: Contains utility classes for defining borders, e.g. `border-t-<size>`, `first-child:rounded-t-<size>`, etc.
  - `/theme/utils/colors.scss`: Contains utility classes for defining colors, e.g. `bg-<color>`, `hover:bg-<color>`, `text-<color>`, etc.
  - `/theme/utils/effects.scss`: Contains utility classes for defining effects, e.g. `shadow-<size>`, `hover:shadow-<size>`, etc.
  - `/theme/utils/iconography.scss`: Contains utility classes for styling icons, because GTK uses special CSS properties for this, e.g. `gtk-icon-style-<style>`, `gtk-icon-size-<size>`, etc.
  - `/theme/utils/spacing.scss`: Contains utility classes for defining spacing, e.g. `p-<size>`, `px-<size>`, `mt-<size>`, etc.
  - `/theme/utils/transitions.scss`: Contains utility classes for defining transitions, e.g. `transition-<property>`, `duration-<time>`, `timing-<timing>`, etc.
  - `/theme/utils/typography.scss`: Contains utility classes for defining typography, e.g. `text-<size>`, `font-<family>`, etc.
  - ...possibly more in the future.
- `/theme/widgets/<theme-name>/<gtk-widget-name>.scss`: Contains custom styling for GTK built-in widgets. This is mostly used to make GTK 4 widgets fit the libadwaita theming, or if a GTK component has children that cannot be targeted with utility classes on the top-level component (because they usually need to be selected with a more complex selector). This should only be use sparingly, as most widgets can be styled using utility classes, or don't need custom styling.
- `/theme/index.ts`: The main entry point for the theme, which compiles all styles into a single CSS string and exposes a getter function, which can be used as `getStylesheet("libadwaita-dark")` to get the styles for a specific theme. This is used in the main `app.ts` file to set the CSS of the application.

## Code Style & Conventions

- **Sass**: The theme uses Sass for styling.
- **Utility Classes**:
  - ALWAYS PREFER utility classes (or adding new utility classes, if it makes sense) over writing custom styles for just one component.
  - IMPORTANT: The utility classes should closely follow the naming conventions of Tailwind CSS. But of course, some might be different due to GTK's specific requirements or stylistic choices.
  - IMPORTANT: NOT ALL utility classes provided by a large library like Tailwind CSS are implemented here! Ony the utility classes that are actually used in the shell are implemented, plus a few "dead" ones because the `@each` directive in Sass is used to generate most classes based on a list of sizes, colors, etc. (not all combinations of which are used in the shell, of course).
  - When adding new utility classes, check their naming in the [Tailwind CSS docs](https://tailwindcss.com/docs) and try to follow the same conventions and values (e.g. `xs`, `sm`, `md`, etc.). Of course, it's fine to use less values compared to Tailwind, if they are not used at the moment.
