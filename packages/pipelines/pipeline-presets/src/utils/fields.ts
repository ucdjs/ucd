export function splitTwoFields(
  line: string,
  delimiter: string,
): [string, string] | null {
  const parts = line.split(delimiter);
  if (parts.length < 2) return null;
  return [parts[0]!, parts[1]!];
}

export function splitMinFields(
  line: string,
  delimiter: string,
  minFields: number,
): string[] | null {
  const parts = line.split(delimiter);
  return parts.length >= minFields ? parts : null;
}
