# Components

The `/components` directory contains all the custom components that make up the shell. It follows the atomic design file structure (slightly modified), which means that components are organized into atoms, molecules, organisms, partials, and HOCs (higher-order components). The components themselves use [AGS v3](https://aylur.github.io/ags), [Astal](https://aylur.github.io/astal) & [Gnim](https://aylur.github.io/gnim/tutorial/gnim) by [Aylur](https://github.com/Aylur), and are written in TypeScript / TSX. Gnim is a library which brings JSX and reactivity to GNOME JavaScript (GJS), so please note that although the components are written in JSX syntax, they have nothing to do with React! In fact, the reactivity model is based on signals, so the components look more like SolidJS (even though they're not compatible with SolidJS either). Refer to the Gnim documentation for more information on how to write components. So, to recap:

- AGS (v3): A scaffolding CLI tool for Astal + Gnim projects.
- Astal: Building blocks for creating custom desktop shells. This includes libraries for interacting with `NatworkManager`, `Notifd`, `Bluetooth`, `Wireplumber`, and many more. See the full list of Astal libraries here: [Astal Docs: Astal Libraries](https://aylur.github.io/astal/guide/libraries/references#astal-libraries).
- Gnim: A library that introduces JSX and reactivity to GJS, making it easier to write GNOME applications with a component-based architecture.

The Gnim documentation contains a lot of useful information on how to write components, so please refer to it if you have any questions about the component structure or how to use Gnim features.

## File Structure

In the directory of every component group (e.g. `atoms`), there is a subfolder for each component (kebab-case), which contains the `.tsx` file of the respective component (SnakeCase). A few of the component folders also contain subfolders for "private-ish" subcomponents, which are only used in the respective component. The file structure of `/components` is as follows:

- `/components/atoms`: Contains the smallest building blocks of the shell, such as buttons, icons, and other simple components.
  - `/components/atoms/<component-name>/<ComponentName>.tsx`: The main component file.
- `/components/hocs`: Contains higher-order components (HOCs) that wrap other components to provide additional functionality or styling (e.g., `ListBox.tsx`).
  - `/components/hocs/<hoc-name>/<HocName>.tsx`: The main HOC file.
- `/components/molecules`: Contains components that are composed of multiple atoms, such as the `Tray.tsx` or `MusicPlayer.tsx` components.
  - `/components/molecules/<component-name>/<ComponentName>.tsx`: The main component file.
- `/components/organisms`: Contains more complex components that are composed of multiple molecules and atoms, such as the `NotificationCenter.tsx` component.
  - `/components/organisms/<component-name>/<ComponentName>.tsx`: The main component file.
- `/components/partials`: Contains components that make up an entire self-contained part of the shell, such as the `Bar.tsx` (status bar), `NotificationCenterPopupWindow.tsx` or `LauncherPopupWindow.tsx` components.
  - `/components/partials/<component-name>/<ComponentName>.tsx`: The main component file.

## Component Structure

The function of a component should follow the structure described below. At a high level, each component has variables, state, handlers etc. at the top, and then returns the JSX element at the bottom. The top part should be split into commented sections in the following order (note that not every section is required for every component):

- `// Props`: Destructuring of the props passed to the component.
- `// Constants`: Any constants that are used in the component and don't change over its lifetime.
- `// Refs`: Variables that are assigned a reference to an element in the component during its consruction or lifetime, or references to unsubscriber functions, etc. For example: `let doNotDisturbSwitch: Gtk.Switch;`.
- `// State`: Gnim signals created using `createState`, `createComputed`, `createBinding`, etc., and other `Accessor`s. Refer to the Gnim documentation to see which signals are available for use in the context of an AGS / Gnim project.
- `// Handlers`: Functions that handle events, such as button clicks, state changes, etc. These functions should be defined as `const`s.
- `// Lifecycle`: Gnim `onMount` and `onCleanup` callbacks, if needed. These are useful to clean up manual subscriptions, among other things.

Below the parts described above, the component should return the required JSX.

### Examples

- See `/components/atoms/workspace-indicator/WorkspaceIndicator.tsx` for an example of a simple atom component with some props, state, and a subcomponent rendered in a reactive list.
- See `/components/atoms/clickable-box/ClickableBox.tsx` for a simple component that uses the `$=` setup prop, and manages a subscription manually.

## Code Style & Conventions

- Each component is an exported, named `const` function that returns a JSX element, e.g. `export const ComponentName = (props: ComponentNameProps) => { ... }`.
- Each component has an accompanying `type` that defines its props, which is exported as well. E.g., `export type ComponentNameProps = { ... }`.
- Reusable pieces of a component should either be extracted into a separate component (if they are generic enough and can be used by multiple components), or should be defined as private `const` functions inside the same component file as the main component they ar epart of.
- CSS classes should be defined in the `class=` prop of the JSX element. If the classes are static, they can be defined as a string literal. If they are dynamic, use the `cx` helper to merge multiple class definitions or apply certain classes conditionally. E.g.: `<box class={cx("divide-x divide-gray-500", classOverride)} {...restProps}>`.
- **TypeScript**: Prefer strict, clean, and expressive types. Avoid `any` in almost all cases! Use expressive variable names, and don't abbreviate or shorten names.
- **Styling**: DO NOT write custom styles for a specific component unless absolutely necessary! Use utility classes instead. The utility classes are inspired by Tailwind CSS, but not every class is implemented here (and there might even be slight differences in naming). If you need a new utility class, add it to the respective Sass files in `/theme/` and follow the naming conventions of Tailwind CSS as closely as possible.
