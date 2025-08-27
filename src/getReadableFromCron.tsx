import cronstrue from "cronstrue";

export function getReadableFromCron(cron: string): string | undefined {
  try {
    return cronstrue.toString(cron);
  } catch {
    return;
  }
}
