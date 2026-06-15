// The "active group" is the group the home screen currently shows. We persist
// it in a cookie (not just localStorage) so the server-rendered home page can
// read it directly. Client code sets it on create / join / switch.

export const ACTIVE_GROUP_COOKIE = "stack.group";

/** Client-side: mark a group active, then navigate to /home to see it. */
export function setActiveGroup(groupId: string) {
  // 1 year, lax so it survives the invite-link round trip.
  document.cookie = `${ACTIVE_GROUP_COOKIE}=${groupId}; path=/; max-age=31536000; samesite=lax`;
}

/** Client-side: clear the active group (e.g. after leaving the last group). */
export function clearActiveGroup() {
  document.cookie = `${ACTIVE_GROUP_COOKIE}=; path=/; max-age=0; samesite=lax`;
}
