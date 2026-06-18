-- STACK_FIXES2 D — group ownership + owner-only member removal.
--
-- Adds an explicit owner (backfilled to the creator) and a server-enforced RLS
-- policy so ONLY the owner can remove another member. The existing self-leave
-- policy stays. Removing a member deletes their membership row (revoking future
-- access); their historical check-ins are intentionally KEPT.

alter table groups
  add column if not exists owner_id uuid references profiles(id);

update groups set owner_id = created_by where owner_id is null;

-- Owner can remove ANY member of their group except themselves. This is the
-- security boundary (not the hidden UI button): a non-owner delete is denied.
drop policy if exists "owner removes members" on group_members;
create policy "owner removes members" on group_members
  for delete using (
    user_id <> auth.uid()
    and exists (
      select 1 from groups g
      where g.id = group_members.group_id
        and coalesce(g.owner_id, g.created_by) = auth.uid()
    )
  );
