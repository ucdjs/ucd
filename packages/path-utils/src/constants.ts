export const MAX_DECODING_ITERATIONS = 10;

export const WINDOWS_DRIVE_LETTER_START_RE = /^[A-Z]:/i;
export const WINDOWS_DRIVE_LETTER_EVERYWHERE_RE = /[A-Z]:/i;
export const WINDOWS_DRIVE_RE = /^[A-Z]:[/\\]/i;

export const WINDOWS_UNC_ROOT_RE = /^\\\\(?![.?]\\)[^\\]+\\[^\\]+/;

export const CONTROL_CHARACTER_RE = /\p{Cc}/u;
