// The Content-Security-Policy `nginx.conf` sends, read from the file, so the
// browser check applies the policy production serves (blog#21).

export function cspOf(conf) {
  const found = [
    ...conf.matchAll(/^\s*add_header\s+Content-Security-Policy\s+"([^"]+)"/gm),
  ];
  if (found.length !== 1) {
    throw new Error(
      `nginx.conf sets the CSP ${found.length} times, not once; the checks read one`
    );
  }
  return found[0][1];
}
