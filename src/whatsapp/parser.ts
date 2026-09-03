import { ParsedCommand } from "@/types/baileys";

export function parseCommand(text: string): ParsedCommand | null {
  const trimmed = text.trim();

  // Regex untuk mencocokkan kata dan mendukung tanda kutip "..." atau '...'
  const matches = trimmed.slice(1).match(/[^\s"']+|"([^"]*)"|'([^']*)'/g);

  if (!matches || matches.length === 0) return null;

  const rawCmd = matches[0];
  const args = matches.slice(1).map((arg) => {
    if (
      (arg.startsWith('"') && arg.endsWith('"')) ||
      (arg.startsWith("'") && arg.endsWith("'"))
    ) {
      return arg.slice(1, -1);
    }
    return arg;
  });

  return {
    command: rawCmd.toLowerCase(),
    args,
    raw: trimmed,
  };
}
