// ONLY STOW TYPES IN HERE WHEN THEY CAN'T BE COLOCATED WITH THE CODE THAT USES THEM

export interface FSAdapter {
  readFile: (path: string) => Promise<string>;
}
