---
author: Stefan M. Gulbrandsen
pubDatetime: 2027-02-02T07:00:00Z
title: "Nightly Postgres backups to a home NAS with a write-only ssh key"
slug: nightly-database-backups-write-only-ssh-key
featured: false
draft: false
tags:
  - infrastructure
  - security
description: Two of my apps' Postgres databases now get a pg_dump every night from a GitHub Actions job, sent with rsync to a home NAS. The server's key can only write, so a stolen server can't wipe the backups. What it took, and what is still open.
---

Until November, the only backup of my apps' databases was my hosting
provider's whole-server backup, once a week. A lost server could cost up to
seven days of data. And a restore would roll back every app on that server,
not just the one that broke.

The fix turned out to be one small job and one hard question.

## The small job

Each night, a scheduled GitHub Actions job on the server runs `pg_dump` once
for each database. The server keeps the last 14 days of dumps. Each new dump
goes off the server with rsync over ssh, to a machine at home. Later in the
night, the home NAS pulls that folder.

Dump, keep, send, pull. None of it is clever. The script that does the first
three is a small shared part, built once and pinned in each app's repo. It
writes each dump under a temporary name and renames it only when it is
whole. A failed dump or a failed send makes the night's run red, and the
dump stays on the server.

## The hard question

The hard question was what a stolen server should be able to do.

A backup that lives at home is only useful if whoever takes over the server
can't reach it. But the server has to log in at home every night to deliver
the dump. So the key it uses is the thing an attacker would hold.

The answer is a key that can only write. On the home machine, its line in
`authorized_keys` hands every login to `rrsync`, the restricted rsync that
ships with rsync, in write-only mode:

```
restrict,command="rrsync -wo -no-del -no-overwrite <folder>" <public key>
```

With that key, the server can put new files into one folder. It can't read
them back, delete them or overwrite them, and it gets no shell. Someone who
owns the server can fill that folder with junk. They can't touch last week's
dumps.

Each app gets its own key and its own folder. One app's key can't reach
another app's backups.

The NAS side is the mirror of it. Its key reads the dumps folder and nothing
else, in `rrsync`'s read-only mode. The NAS needed a second key for that: ssh
uses the first line in `authorized_keys` that matches a key, and the NAS's
existing key was already locked to another folder.

## Which user runs the job?

The issue for the first app had one open question in it: does the user the
CI job runs as even have the route home?

On the server, the ssh route to the home machine belonged to my own user. The agent read the runner's setup in my docs and found the
job doesn't run as me. The self-hosted runner is a system service that runs
as the server's admin account. So my user's ssh config, keys and route were
not what the job would see.

The agent didn't guess. It gave the admin account its own key and its own
ssh entry, reusing the connection my user already had. It wrote down the one
thing it couldn't read from the docs, whether the admin account was allowed
to use that connection at all. The first setup step I had to run checked
exactly that, before anything else depended on it.

Its own review then caught a worse problem in its first draft. The admin
account's route ran a program that lived in my user's home folder. My user
can replace that file. So every night, my everyday account could have run
code as the admin account on the production server. The fix gave the admin
account its own copy of that program, with its checksum checked. A test now
fails if the setup steps ever run one from a home folder again.

The same review limited the manual run to the default branch. Without that,
a run started on any branch would run that branch's script as the admin
account.

## Proving it once

The job has two triggers: the nightly schedule, and a manual run for
proving it once before waiting for night. It has no `pull_request` trigger,
because the runner is the production server.

The tests never touch a real host. They run the workflow's own command with
fake `ssh`, `rsync` and `docker` programs first on the path. To see the
tests fail, the agents broke the setup on purpose, one change at a time: 30
breaks for the first app and 43 for the second. Every break was caught but
one, an `exit 0` added after the command, which can't hide a failure there
anyway.

The second app's issue said to start only after the first app's backup had
run green once, and to copy its route home rather than invent one. The
agent checked, and the first app's workflow wasn't on the default branch
yet. That repo merges into a staging branch first, so GitHub couldn't even
find the workflow to run by hand. The agent stopped and asked. I moved the
first app's change to production and did the setup steps on both machines.

On 12 November the manual run of the first app went green. A dump of about
7 KB went from the server to the home machine.

The second app's agent then found one more thing. Its `.gitignore` came
from the common Python template, which ignores a folder called `parts/`.
That was exactly where the backup script lived. The script would never have
reached the server, and every night would have been red. A test now checks
that git does not ignore it.

## The first night started six hours late

A missing night is silent. The only alarm is a red run, and GitHub can start
a scheduled run late or drop it. The first real night showed that. Both
apps' runs were scheduled after midnight UTC, with more than an hour to
spare before the NAS pulls. GitHub started both more than six hours late,
after the pull had gone. The first app's run was green. The second app's was
red, because I hadn't made its key on the server yet. The send failed, and
nothing was deleted.

Nothing deletes old dumps at home. The server's key can't, and the NAS pull
doesn't, so both keep every night.

And this is about getting dumps off the server, not about restoring them.
For one of the two apps, a restore drill came the next day: it loads the
newest dump into a throwaway database.

The numbers, from 12 and 13 November:

- Before: one whole-server backup a week, up to 7 days lost.
- Now: one dump per database per night, 14 days kept on the server.
- Keys: one per app, write-only, plus one read-only key for the NAS.
- The first proof run: green, about 7 KB sent.
- The first scheduled night: both runs started over six hours late.

The next reading is on 26 November: how many of the last seven nights had a
green backup run, for each app.
