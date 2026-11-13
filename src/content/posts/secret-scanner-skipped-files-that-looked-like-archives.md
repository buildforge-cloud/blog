---
author: Stefan M. Gulbrandsen
pubDatetime: 2027-01-26T07:00:00Z
title: "Gitleaks skipped text files that looked like archives, and my scan still said OK"
slug: secret-scanner-skipped-files-that-looked-like-archives
featured: false
draft: false
tags:
  - security
  - testing
description: My secret scan runs gitleaks 8.30.1. A text file with tar's magic bytes in the right place was skipped as binary, and the hook still printed OK. How an agent updating ISO Pathfinder Buddy found it, and the fix that makes each file prove it was read.
---

The hook printed `OK: 1 staged file(s) scanned`. The file it had just
scanned held a GitHub token, a made-up one, on its second line. The first
line was 256 bytes of filler and then the word `ustar`.

That file was built on purpose. Another agent had said my scanner had a
blind spot, and this was the proof that it did.

## A routine update

On 12 November an agent was updating the shared checks in
[ISO Pathfinder Buddy](https://iso-pathfinder-buddy.lovable.app/roadmap), my
ISO 27001 compliance guide. All my projects share one secret scanner. It is a
small Python wrapper around
[gitleaks](https://github.com/gitleaks/gitleaks), kept in one private
template repo and pinned by hash in each project. Every commit goes through
it, and so does every pull request. The agent's job was to move ISO
Pathfinder Buddy to the scanner's new 2.0.0 release. Nothing about
the job was meant to be interesting. Update the pinned files, run the checks,
open a pull request.

Then it reviewed its own pull request, and one finding was about the scanner
itself, not the update. The scanner puts a blank line at the top of every
file it hands to gitleaks. That trick was there to stop gitleaks from
mistaking a text for a binary file by its first bytes. The agent noticed it
only works for the first bytes. It tried a file with `ustar` after 256 other
bytes, and the scan found nothing.

It couldn't fix it there. The scanner is pinned, and the project's checks
fail on a hand edit. So it wrote the hole down under "Known limits" in its
pull request and proposed it as a fix for the template. So the fix started
as a known limit, written down by a worker in another project, during an
update that was supposed to be boring.

## Why gitleaks never opened the file

gitleaks 8.30.1 reads the first 100 KB of a file and asks a file-type library
what it is. If the answer is any binary type, it skips the file. That is
reasonable. Nobody wants a scanner grinding through images.

The catch is where those matchers look. Some look at byte 0, which is what
my blank line was for. Others look further in. A tar archive is known by
`ustar` at byte 257. DICOM, the medical image format, is checked at byte 128.
An ISO disk image has `CD001` at byte 32769.

My one blank line moved a file's content by one byte. So a text with `ustar`
at byte 256 had it at 257 by the time gitleaks saw it, and gitleaks called it
a tar and went on to the next file. The wrapper got an empty report back and
read that as clean.

I had believed "OK" meant "gitleaks read this and found nothing". It meant
"gitleaks said nothing".

## The first idea was padding

The issue for the fix gave two options. One was to pad the start of every
file past the deepest offset a matcher looks at. Then no magic bytes could
ever land in the right place.

The agent that took the issue dropped it. Past the deepest offset known
today, that is 32 KB of newlines in front of every file. For a scan of a
whole git history it adds up to hundreds of MB. And it only covers the
matchers that exist today. The next gitleaks release could add one deeper.

## Making each file prove it was read

The second option was to check that gitleaks read every file. That is the
one it built, and released as 2.1.0 on 12 November.

Every file the scanner hands over now ends with one extra line, a marker. The
scanner also adds a rule of its own that matches only that marker. If
gitleaks read the file, it reports the marker on the last line. If the marker
isn't reported, the file was not read, whatever the reason was.

That last part is what I like about it. It doesn't try to know why gitleaks
skipped something. It checks the outcome. A new matcher in the next release
gets caught the same way.

The first version of the fix refused every unread file outright. Its own
review found the problem with that: a real text file that happens to look
like a tar would be refused forever, and a whole-history scan in CI would
stay red with no way out. So an unread file now gets one more try, shifted
by one byte. None of gitleaks's matchers matches at two neighbouring
offsets, so a file that looked like a tar the first time doesn't the second
time.

A file still unread after that is refused with its own exit code and its
name. It is never "OK". And if the scan also found a real key, that wins: the
exit code says a credential was found and to revoke it, and the unread file
is named too.

## A second hole, on the last line

Testing the marker turned up a gitleaks bug I didn't know about.

My scanner lets a line say it is an example, with a `secret-scan: example`
comment, so docs can show the shape of a key. In the release before the
fix, a key on the last line of a file passed the scan whenever any line in the file had that
comment, as long as the last line had no newline after it.

The cause is in how gitleaks finds the start of the line a match is on. For a
match on a last line with no newline, it never sets that start. So the
"is this line an example?" check read the whole file up to the key, found
the comment somewhere above it, and let the key through.

The marker closed this one by accident. It ends with a newline, so no line
of a real file is ever the last line any more.

## Where it can still fail, loudly

Two limits are written down in the pull request.

A text that gitleaks takes for binary on both tries, say a tar header at
byte 256 and an ISO's `CD001` at byte 32767, is refused with no way through
except moving that text. No real text is expected to look like that.

And a future gitleaks matcher that matched at two neighbouring offsets would
make those files refused, not read. That is a loud failure. The marker still
proves every read, so it can't turn into a quiet pass.

The numbers, from the fix's pull request on 12 November:

- gitleaks version: 8.30.1.
- Matcher offsets past byte 0: 128 (DICOM), 257 (tar), 32769 (ISO).
- Padding that would have covered them: 32 KB per file.
- Tracked files the scanner read in its own repo after the fix: 276.

Each project that pins the scanner takes a new release with one update
command. ISO Pathfinder Buddy, [ps·db](https://ps-db.cloud) and
[Vedlikeholdsloggen](https://vedlikeholdsloggen.buildforge.no/) all took
2.1.0 the same evening. I wrote this the day after, on 13 November. Nothing
more is planned for the read check. The two limits stay written down until a
real file runs into one of them.
