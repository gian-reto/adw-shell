# Agent Guidance

This document provides guidance for AI agents on how to interact with this repository, which contains an AGS v3 shell configuration (see: [GitHub: Aylur/ags](https://https://github.com/aylur/ags)) with status bar, launcher, and other widgets, as well as an accompanying flake for NixOS. The languages used are primarily TypeScript, as well as some Nix.

AGS is a scaffolding CLI tool for Astal + Gnim projects. Astal is a set of libraries written in Vala/C that makes writing a Desktop Shell easy. Gnim is a library which introduces JSX to GJS. GJS is a JavaScript runtime built on Firefox's SpiderMonkey JavaScript engine and the GNOME platform libraries, the same runtime GNOME Shell runs on.

Look at the top-level `README.md` for general information abut this project.

## Documentation

- AGS: https://aylur.github.io/ags
- Gnim: https://aylur.github.io/gnim/tutorial/gnim
- GTK 4 (to find plain GTK components): https://docs.gtk.org/gtk4
- libadwaita (to find libadwaita components): https://gnome.pages.gitlab.gnome.org/libadwaita/doc/1-latest

### Documentation for Astal Libraries

- [Apps](https://aylur.github.io/libastal/apps): Library and cli tool for querying applications.
- [Auth](https://aylur.github.io/libastal/auth): Authentication library using PAM.
- [Battery](https://aylur.github.io/libastal/battery): DBus proxy library for upower daemon.
- [Bluetooth](https://aylur.github.io/libastal/bluetooth): Library to control bluez over dbus.
- [Cava](https://aylur.github.io/libastal/cava): Audio visualizer library using cava.
- [Greet](https://aylur.github.io/libastal/greet): Library and CLI tool for sending requests to greetd.
- [Hyprland](https://aylur.github.io/libastal/hyprland): Library and cli tool for Hyprland IPC socket.
- [Mpris](https://aylur.github.io/libastal/mpris): Library and cli tool for controlling media players.
- [Network](https://aylur.github.io/libastal/network): NetworkManager wrapper library.
- [Notifd](https://aylur.github.io/libastal/notifd): A notification daemon library and cli tool.
- [PowerProfiles](https://aylur.github.io/libastal/powerprofiles): Library and cli to control upowerd powerprofiles.
- [River](https://aylur.github.io/libastal/river): Library and cli tool for getting status information of the river wayland compositor.
- [Tray](https://aylur.github.io/libastal/tray): A systemtray library and cli tool.
- [WirePlumber](https://aylur.github.io/libastal/wireplumber): A library for audio control using wireplumber.

## File Structure

- `/@girs`: Contains the generated GJS types for the Astal, GNOME, etc. libraries used in this project. Useful for looking up what's available to import using `gi://` imports. DO NOT MODIFY MANUALLY.
- `/components`: Contains the custom components (i.e., the building blocks) of the shell. This contains the majority of the code of this project.
- `/theme`: Contains the theme files for the shell, written in SCSS.
- `/util`: Contains utility functions and helpers, written in TypeScript.
- `/widgets`: Contains some types and wrapper components for built-in GTK widgets, such as `GtkBox`, `GtkButton`, etc. Only rarely needs changes or additions.

IMPORTANT: Each of these directories (except `/@girs`) has a `README.md` file with more information about the contents and usage of the respective directory. Please read them before making changes in any of these directories.

## Commands

Note: Non-Nix commands like `tsc` or `biome` are only available inside the dev shell!

- **Build**: `nix build` (builds the shell using flake.nix).
- **Dev shell**: `nix develop` (enters development environment with AGS).

Inside the dev shell, you can use the following commands:

- **Lint**: `biome check .` (lints with Biome).
- **Format**: `biome format --write .` (formats code).
- **Type check**: `tsc` (TypeScript type checking).
- Generate `@girs` types: `ags types -d "<path-to-this-repo>"`, e.g. `ags types -d "/home/gian/Code/gian-reto/adw-shell"`. Rarely needed, as the types are already generated in the `@girs` directory and regeneration is only needed when the used libraries in `flake.nix` change.
- DO NOT use `ags run` to test the shell. This command blocks indefinitely and is not suitable for agentic coding.

## Code Style & Conventions

IMPORTANT: Although AGS / Gnim uses JSX, it is not React! It works nothing like React and has nothing in common with React other than the JSX syntax, much like something like Solid JS. DO NOT use React idioms or patterns in your code. Use the Gnim API as documented.

- **Language**: TypeScript with JSX (components using AGS / GTK4).
- **Formatting**: Biome formatter with double quotes, space indentation.
- **Imports**: Use relative imports for local modules, absolute for external packages.
- **Naming**:
  - camelCase for variables / functions.
  - PascalCase for components.
  - kebab-case for file names.
- **Types**: Strict TypeScript enabled, define interfaces in separate `.ts` files when complex.
- **Error handling**: Use try / catch for async operations, graceful degradation for missing services.
- **State**: Use AGS's `createState`, `createBinding`, `createComputed` for reactive state.
- **Components**: Export named functions, use destructured props, follow existing patterns.
- **Icons**: Use icon constants arrays, implement fallbacks for missing icons.
- **Services**: Import from `gi://` namespace (e.g., `gi://AstalBattery`).

## Development Tips

- Use the available MCP servers / tools at your disposal to verify your work and research solutions.
- Use the context7 MCP server to look up documentation for Astal, AGS v3, Gnim, and GNOME stuff.
