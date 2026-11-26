---
author: Stefan M. Gulbrandsen
pubDatetime: 2027-02-02T07:00:00Z
title: "Gitleaks skipped text files that looked like archives"
slug: secret-scanner-skipped-files-that-looked-like-archives
featured: false
draft: false
tags:
  - security
  - testing
description: My secret scan runs gitleaks 8.30.1. A text file with tar's magic bytes in the right place was skipped as binary, and the hook still printed OK. How an AI agent updating ISO 27001 Buddy found it, and the fix that makes each file prove it was read.
---

My secret scanner's pre-commit hook printed `OK: 1 staged file(s) scanned`. The file it had
just scanned held a GitHub token, a made-up one, on its second line. The first
line was 256 bytes of filler and then the word `ustar`, which a tar archive
carries in its header.

That file was built on purpose, by an AI agent that suspected my scanner had
a blind spot. The file proved it right.

## A routine update

On 12 November 2026 that agent was updating the secret scanner in
[ISO 27001 Buddy](https://iso.buildforge.no/roadmap), my step-by-step guide
to ISO 27001 certification. All my projects share that scanner. It is a
small Python wrapper around
[gitleaks](https://github.com/gitleaks/gitleaks). It lives in one private
template repo, which ships it in numbered releases. Each project keeps a
copy of a release, and the project's own checks compare that copy's hash with the
release's, so nobody edits it by hand. Every commit goes through the scanner,
and so does every pull request. The agent's job was to move ISO 27001 Buddy
to the scanner's new 2.0.0 release (the wrapper's own
version, not gitleaks's). Nothing about
the job was meant to be interesting. Update the copied files, run the checks,
open a pull request.

Then the agent reviewed its own pull request, and one finding was about the scanner
itself, not the update. The scanner hands gitleaks a copy of each file,
with a blank line put at the top. That trick was there to stop gitleaks from
mistaking a text for a binary file by its first bytes. The agent noticed it
only works for the first bytes. It tried a file with `ustar` after 256 other
bytes, and the scan found nothing.

The agent couldn't fix it there, since the project's checks fail on a hand
edit. So it wrote the hole down in its pull request, under "Known limits", and
proposed a fix to the template repo.

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
a tar and went on to the next file. The scanner got an empty report back
from gitleaks and read that as clean.

I had read "OK" as "gitleaks read this file and found nothing". All it ever
told me was that gitleaks reported nothing.

## The first idea was padding

The template repo got an issue for the fix, which gave two options. One was to pad the start of every
file past the deepest offset a matcher looks at. Then no magic bytes could
ever land in the right place.

A second AI agent took that issue, and dropped the padding. Past the deepest offset known
today, that is 32 KB of newlines in front of every file. For a scan of a
whole git history, every version of every file, it adds up to hundreds of MB. And it only covers the
matchers that exist today. The next gitleaks release could add one deeper.

## Making each file prove it was read

The second option was to check that gitleaks read every file. That is the
one it built, and released as 2.1.0 the same day, 12 November.

Every file the scanner hands over now ends with one extra line, a marker
that it adds after the file's own last line. The
scanner also adds a rule of its own that matches only that marker. If
gitleaks read the file, it reports the marker on the last line. If the marker
isn't reported, the file was not read, whatever the reason was.

That last part is what I like about it. It doesn't try to know why gitleaks
skipped something. It checks the outcome. A new matcher in the next release
gets caught the same way.

The first version of the fix refused every unread file outright. The second
agent's review of that first version found the problem with it: a real text file that happens to look
like a tar would be refused forever, and a whole-history scan in CI would
stay red with no way out. So an unread file now gets one more try, with one
more byte at the top, so its content sits one byte further in. None of gitleaks's matchers matches at two neighbouring
offsets, so a file that looked like a tar the first time doesn't the second
time.

A file still unread after that is refused, by name, with its own exit
code. It is never "OK". And if the scan also found a real key, that wins: the
exit code says a credential was found and to revoke it, and the unread file
is named too.

## A second hole, on the last line

Testing the marker turned up a gitleaks bug I didn't know about.

My scanner lets a line say it is an example, with a `secret-scan: example`
comment, so docs can show the shape of a key. In 2.0.0, the release before
the fix, a key on the last line of a file passed the scan whenever any line in the file had that
comment, as long as the last line had no newline after it.

The cause is in how gitleaks finds the start of the line a match is on. For a
match on a last line with no newline, it never sets that start. So the
"is this line an example?" check read the whole file up to the key, found
the comment somewhere above it, and let the key through.

The marker closed this one by accident. It ends with a newline, so no line
of a real file is ever the last line any more.

## Where it can still fail, loudly

Two limits are written down in the pull request.

A text that gitleaks takes for binary on both tries is refused with no way
through except moving that text. Say it has `ustar` at byte 256 and `CD001`
at byte 32767. With the blank line, the first try puts `ustar` at 257, where
tar's matcher looks. One more byte on the second try puts `CD001` at 32769,
where the ISO matcher looks. No real text is expected to look like that.

And a future gitleaks matcher that matched at two neighbouring offsets would
make those files refused, not read. That is a loud failure. The marker still
proves every read, so it can't turn into a quiet pass.

The numbers, from the fix's pull request on 12 November:

- gitleaks version: 8.30.1.
- Matcher offsets past byte 0: 128 (DICOM), 257 (tar), 32769 (ISO).
- Padding that would have covered them: 32 KB per file.
- Files in the template repo that proved they were read after the fix: 276.

Each project that keeps a copy of the scanner took 2.1.0 with two update commands:
first a new release of the small tool that checks and updates those copies,
then the scanner's. ISO 27001 Buddy, [ps·db](https://ps-db.cloud) (my PS5
game database) and
[Vedlikeholdsloggen](https://vedlikeholdsloggen.buildforge.no/) (my
Norwegian home maintenance app) all took 2.1.0 the same evening. I wrote
this the day after, on 13 November 2026. Nothing
more is planned for the read check. The two limits stay written down until a
real file runs into one of them.
