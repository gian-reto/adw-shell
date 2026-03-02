import GLib from "gi://GLib";
import { monitorFile, readFile } from "ags/file";
import { execAsync } from "ags/process";

// Types

type Command = string | string[];

type Config = {
  readonly commands: {
    readonly lock: Command;
    readonly "log-out": Command;
    readonly restart: Command;
    readonly screenshot: Command;
    readonly shutdown: Command;
    readonly suspend: Command;
  };
};

// Constants

const CONFIG_DIR = `${GLib.get_user_config_dir()}/adw-shell`;
const CONFIG_PATH = `${CONFIG_DIR}/config.json`;

const DEFAULTS: Config = {
  commands: {
    "log-out": ["hyprctl", "dispatch", "exit"],
    lock: ["hyprlock"],
    restart: ["systemctl", "reboot"],
    screenshot: ["grimblast", "--notify", "--freeze", "copy", "area"],
    shutdown: ["shutdown", "now"],
    suspend: ["systemctl", "suspend"],
  },
};

// State

let config: Config = DEFAULTS;

// Initialization

const loadConfig = (): void => {
  try {
    const raw = readFile(CONFIG_PATH);
    if (!raw) {
      config = DEFAULTS;
      return;
    }

    const parsed: Partial<Config> = JSON.parse(raw);

    config = {
      commands: {
        ...DEFAULTS.commands,
        ...parsed.commands,
      },
    };

    console.log("Loaded config from: ", CONFIG_PATH);
  } catch (error: unknown) {
    console.warn("Failed to read config, using defaults: ", error);
    config = DEFAULTS;
  }
};

/**
 * Loads the config and starts monitoring the config directory for changes.
 * Should be called once during application startup.
 */
export const setupConfigListener = (): void => {
  loadConfig();

  monitorFile(CONFIG_DIR, () => {
    console.log("Config directory changed, reloading config...");
    loadConfig();
  });
};

// Helpers

/**
 * Executes a configured command by category and name. The command is resolved
 * from the current config at call time.
 */
export const execConfigCommand = (
  name: keyof Config["commands"],
): void => {
  const command = config.commands[name];

  execAsync(command).catch((error: unknown) => {
    console.error(`Failed to execute command "${String(name)}": `, error);
  });
};
