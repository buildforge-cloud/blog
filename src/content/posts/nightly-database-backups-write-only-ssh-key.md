---
author: Stefan M. Gulbrandsen
pubDatetime: 2027-02-09T07:00:00Z
title: "Nightly Postgres backups to a home NAS with a write-only ssh key"
slug: nightly-database-backups-write-only-ssh-key
featured: false
draft: false
tags:
  - infrastructure
  - security
description: Two of my apps' Postgres databases now get a pg_dump every night from a GitHub Actions job, sent with rsync to a machine at home, and a NAS pulls them from there. The server's key can only write, so a stolen server can't wipe the backups. What it took, and what is still open.
---

Until November 2026, the only backup of my apps' databases was my hosting
provider's whole-server backup, once a week. A lost server could cost up to
seven days of data. And a restore would roll back every app on that server,
not just the one that broke.

## A dump each night

I have two apps with a Postgres database on one rented server. Each night,
a scheduled GitHub Actions job, run by a self-hosted runner on that
server, runs `pg_dump` once for each
database. The server keeps the last 14 days of dumps. Each new dump
goes off the server with rsync over ssh, to the home machine, a small computer
at home. Later in the night, my NAS, the network storage box at home, pulls
that folder from the home machine.

None of it is clever. The script that makes the dumps, keeps 14 days of them and sends them is
written once,
and both apps keep the same copy of it in their repos. It writes each dump under a temporary name and renames it only when it is
whole. A failed dump or a failed send makes the night's run fail, and the
dump stays on the server.

## What a stolen server can do

The part that took thought was what a stolen server should be able to do.

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
else, in `rrsync`'s read-only mode. The NAS already had a key on the home
machine, locked to another folder. ssh uses the first line in
`authorized_keys` that matches a key, so one key can't also be given a
second folder. The NAS needed a second key for the dumps.

## Which user runs the job?

Each app got its own GitHub issue for this work. The one for the first app
had one open question in it. On the
server, the ssh route to the home machine belonged to my own user. Did the
user the CI job runs as have that route at all?

An AI coding agent took the issue. It read in my setup notes how the job's
runner is set up, and found the job doesn't run as me. The runner is GitHub's
self-hosted runner, a system service that runs as the server's admin
account. So my user's ssh config, keys and route were not what the job
would see.

The agent didn't guess. It gave the admin account its own key and its own
ssh entry, reusing the route my user already had. It also wrote me a list of
setup steps to run by hand. One thing it couldn't read from the notes was
whether the admin account was allowed to use that route at all, so the
first step checked exactly that, before anything else depended on it.

The agent's review of its own pull request then caught a real hole. The admin
account's ssh entry ran a program that lived in my user's home folder. My user
can replace that file. Whoever controlled my everyday account could have
swapped it, and the admin account would have run the new one every night, on
the production server. The fix gave the admin
account its own copy of that program, with its checksum checked. A test now
fails if the setup steps ever run a program from a home folder again.

The same review limited the job's manual run, the one I use to prove it
works, to the default branch. Without that,
a run started on any branch would run that branch's script as the admin
account.

## Proving it once

The job has two triggers: the nightly schedule, and a manual run for
proving it once before waiting for night. It has no `pull_request` trigger,
because the runner is the production server.

The tests never touch a real host. They run the workflow's own command with
fake `ssh`, `rsync` and `docker` programs first on the path (the dump runs
through Docker). To see the
tests fail, the two apps' agents broke the setup on purpose, one change at a time: 30
breaks for the first app and 43 for the second. Every break made a test fail but
one, an `exit 0` added after the command, which can't hide a failure there
anyway.

The second app's issue said to start only after the first app's backup had
run green once, and to copy its route home rather than invent one. The
agent checked, and the first app's workflow wasn't on the default branch
yet. The first app's repo merges into a staging branch first, and GitHub only
runs a workflow by hand once it is on the default branch. The agent stopped
and asked. I moved the first app's change on to the default branch and ran
its setup steps, on the server and
on the home machine.

On 12 November the manual run of the first app went green. A dump of about
7 KB, from a small database, went from the server to the home machine.

The second app's agent then found one more thing. Its `.gitignore` came
from GitHub's standard Python template, which ignores a folder called `parts/`.
That was exactly where the backup script lived. The script would never have
reached the server, and every night would have been red. A test now checks
that git does not ignore it.

## The first night started six hours late

A missing night is silent. The only alarm is a red run, and GitHub can start
a scheduled run late or drop it. The first scheduled night, on 13 November, showed that. Both
apps' runs were scheduled after midnight UTC, with more than an hour to
spare before the NAS pulls. GitHub started both more than six hours late,
after the pull had gone. The first app's run was green. The second app's was
red, because I hadn't yet run the step that makes its key on the server. The
send failed, and the dump stayed on the server, as it should.

Nothing deletes old dumps at home. The server's key can't, and the NAS pull
doesn't, so the home machine and the NAS both keep every night's dump.

This post is about getting dumps off the server. Restoring them is a job of
its own. For the second app, a restore drill followed on 13 November: it loads the
newest dump into a throwaway database.

The numbers, from 12 and 13 November:

- Before: one whole-server backup a week, up to 7 days lost.
- Now: one dump per database per night, 14 days kept on the server.
- Keys: one per app, write-only, plus one read-only key for the NAS.
- The first proof run: green, about 7 KB sent.
- The first scheduled night: both runs started over six hours late.

I wrote this on 13 November, the day after both apps' setups merged. The
first reading was set for 26 November: how many of the last seven nights had
a green backup run, for each app.
