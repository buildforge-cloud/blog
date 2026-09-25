---
author: Stefan M. Gulbrandsen
pubDatetime: 2026-09-25T16:55:00Z
title: 268 copies of a throwaway database
slug: 268-copies-of-a-throwaway-database
featured: false
draft: false
tags:
  - infrastructure
description: My server's disk was at 96%, three weeks after it had been completely full. The biggest thing on it was a test database that every CI run was supposed to throw away, and a comment in my own workflow said it did.
---

The disk was at 96% again.

I wasn't looking for it. An agent was measuring how much room the server had
left, because I want to run more than one agent on it at a time, and the disk
came back as the first thing in the way. Three weeks earlier the same disk had
been completely full. It had been cleaned up then. It had filled back up in
three weeks.

The caches were the obvious suspects, and they weren't innocent. The npm cache
alone was 8.4 GB. But the biggest single thing on the disk was a pile of Docker
volumes with no names: 268 of them, about 13 GB together, not attached to any
container.

That's where I slowed down. Unattached volumes on a server that also runs
production databases are not something I delete on a hunch. A volume can be a
database, and stopped staging data would look exactly like this.

## All but one were 49 MB

They were nearly all the same size. Not roughly the same: all but one were
exactly 49 MB, and the odd one out was empty. Every one was less than three
weeks old. Real data doesn't come in identical slices. Something was stamping
these out.

The dates gave it away. Counted per day, the volumes lined up with the staging
deploys of two projects, cvtailor and ps·db, almost exactly. One busy day in
early September had 36 new volumes and 35 staging deploys. A quiet day had two
of each.

Both projects run a gate before every staging deploy, and part of that gate
starts a throwaway Postgres 16, so the database migrations get tested against a
real database. One of the workflow files even had a comment saying the database
was torn down automatically when the job finished.

The container was torn down. The volume wasn't. The official Postgres image
declares its data directory as a volume, so Docker creates an anonymous volume
for it every time the container starts. When the job ends, the runner removes
the container and leaves that volume where it is.

## The comment was right where it was written

On GitHub's own runners none of this matters, because the whole virtual machine
is thrown away after the job, volumes and all. That's where the gate still runs
for pull requests, which is why pull requests never leaked a thing.

In August I started running cvtailor's gate on my own server for pushes, to
stop paying for CI minutes on hardware I already pay for. I wrote about that in
[A bill for the shape of the work](/posts/a-bill-for-the-shape-of-the-work/),
and ended it by saying the cost would now arrive without an invoice, if it
arrived at all. I was thinking of slowness. It arrived as disk.

Nothing in the gate was wrong. The comment was accurate on the machine it was
written for. GitHub had been doing a cleanup job for me after every run, and
when I moved the job, the cleanup didn't come with it.

## I'd cleaned up the evidence once already

Every one of the 268 volumes was younger than the previous cleanup, and that's
not a coincidence. When the disk was full three weeks earlier, the cleanup
removed dangling volumes too, carefully, checking each one against the live
containers first. The leak was almost certainly running then as well. The
cleanup removed what it had left behind and never asked where it came from.

At the time I also decided against a scheduled prune, because deleting volumes
unattended on this server can delete a database. I still think that was right.
What I built instead was a check that says when the disk is nearly full and
leaves the cleanup to a person. That's a fine answer for a disk that fills up
from normal use. For a leak that adds a volume on every staging deploy, it only
ever gets me to the next cleanup.

## One line, and a test for the line

The fix is a single line in the service's options:

```yaml
--tmpfs /var/lib/postgresql/data
```

When something is already mounted at the path the image declares as a volume,
Docker doesn't create one. With a tmpfs mount there, the test database lives in
memory for the length of the job and disappears with the container. There's
nothing to clean up, because nothing is left.

The catch is that the path belongs to the image, not to me. Postgres 18 moves
its volume to a different path. If the version gets bumped and this line
doesn't move with it, the tmpfs sits next to the volume instead of on top of
it, every check still passes, and the leak comes back with nothing to show for
it. So each project got a test that works out the right path from the image's
major version and fails if the line doesn't match.

The template I start new projects from had the same block, so every new project
would have inherited the leak. That got the fix too. A cleanup job on a timer
was the other option, and I didn't want it: it cleans up after the leak instead
of not having one, and a prune on this server reaches every other project's
volumes as well.

## Typing the deletes myself

The fix stops new volumes. It doesn't remove the 268 already there, and that
part the agent wasn't allowed to do. The safety check that approves its
commands refused `docker volume rm`, and refused even clearing the npm cache.
So I ran each step myself, one at a time, safest first, with a health check
after every step to see that the sites still answered.

Caches first. Then five of the volumes, then the other 263, each one checked
again at the moment of deletion: no name, no container, no compose label,
created after the last cleanup, and no bigger than 60 MB.

The first gate runs on my server after the fix left no new volumes behind. With
the caches and the old volumes gone, the disk went from 96% to 70%.

What I keep coming back to is the list I don't have. The hosted runner threw
away a whole machine after every job, and I'd been relying on that without
knowing it. In August the same move turned up a port that two processes wanted
at once. This time it was disk. I don't know what the third thing is, only that
I won't find it by reading the workflows, because the workflows were right.
