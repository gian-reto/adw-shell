import Apps from "gi://AstalApps";
import { execAsync } from "ags/process";

let isUwsmSession: boolean | undefined = undefined;

/**
 * Checks if the current session is managed by UWSM. Result is cached after the
 * first check.
 */
const checkUwsmSession = async (): Promise<boolean> => {
  if (isUwsmSession !== undefined) {
    return isUwsmSession;
  }

  try {
    // UWSM provides a user service `wayland-wm@*.service`, which we can check for.
    await execAsync([
      "systemctl",
      "--user",
      "is-active",
      "--quiet",
      "wayland-wm@*.service",
    ]);
    isUwsmSession = true;
  } catch {
    isUwsmSession = false;
  }

  return isUwsmSession;
};

/**
 * Launches an application (using UWSM, if available).
 */
export const launch = async (
  app: Apps.Application | undefined,
): Promise<void> => {
  if (!app) {
    return;
  }

  try {
    if (await checkUwsmSession()) {
      console.log(`Launching ${app.name} via UWSM`);
      await execAsync(["uwsm", "app", "--", app.entry ?? app.executable]);
      app.frequency++;
    } else {
      console.log(`Launching ${app.name}`);
      app.launch();
    }
  } catch (error) {
    console.error(`Failed to launch ${app.name}:`, error);
  }
};
