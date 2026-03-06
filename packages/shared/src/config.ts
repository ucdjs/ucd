import { join } from "pathe";
import { env } from "std-env";

function homedir(): string {
  const home = env.HOME;
  if (home) return home;

  const drive = env.HOMEDRIVE;
  const homePath = env.HOMEPATH;
  if (drive && homePath) return join(drive, homePath);

  const userProfile = env.USERPROFILE;
  if (userProfile) return userProfile;

  throw new Error("Could not determine home directory");
}

export function getXdgConfigDir(): string {
  if (env.XDG_CONFIG_HOME) {
    return env.XDG_CONFIG_HOME;
  }

  return join(homedir(), ".config");
}

export function getUcdConfigDir(): string {
  return join(getXdgConfigDir(), "ucd");
}

export function getUcdConfigPath(...segments: string[]): string {
  return join(getUcdConfigDir(), ...segments);
}
