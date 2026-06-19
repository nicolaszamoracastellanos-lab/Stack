// Invite codes: 6 uppercase chars from an unambiguous alphabet (no 0/O, 1/I/L),
// matching the web app's lib/utils.ts so codes look identical across platforms.
const INVITE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

export function generateInviteCode(length = 6): string {
  let out = "";
  for (let i = 0; i < length; i++) {
    out += INVITE_ALPHABET[Math.floor(Math.random() * INVITE_ALPHABET.length)];
  }
  return out;
}
