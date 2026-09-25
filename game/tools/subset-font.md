# Font subset recipe

How `public/fonts/baloo2-subset.woff2` was made, so it can be rebuilt.

## Source

- Font: `https://github.com/google/fonts/raw/main/ofl/baloo2/Baloo2%5Bwght%5D.ttf` (683,200 bytes)
- Licence: `https://github.com/google/fonts/raw/main/ofl/baloo2/OFL.txt` (shipped as `public/fonts/OFL.txt`)
- Downloaded: 25-09-26
- Licence: SIL Open Font License 1.1. Copyright 2019 The Baloo 2 Project Authors (https://github.com/EkType/Baloo2)

Download both into a scratch folder outside the repo. Only the subset and `OFL.txt` are committed.

## Command

Run in Git Bash (it relies on `$TMPDIR` and `\` line continuations). On Windows use `py -3`; `python` is the Store placeholder.

```bash
mkdir -p "$TMPDIR/flip-font" && cd "$TMPDIR/flip-font"
curl -sL -o Baloo2.ttf "https://github.com/google/fonts/raw/main/ofl/baloo2/Baloo2%5Bwght%5D.ttf"
curl -sL -o OFL.txt "https://github.com/google/fonts/raw/main/ofl/baloo2/OFL.txt"
py -3 -m pip install --user fonttools brotli
py -3 -m fontTools.subset Baloo2.ttf \
  --unicodes="U+0020-007E,U+00D7,U+2014,U+2212" \
  --layout-features="kern,liga" \
  --flavor=woff2 \
  --output-file=baloo2-subset.woff2
ls -l baloo2-subset.woff2
```

Then copy `baloo2-subset.woff2` and `OFL.txt` into `game/public/fonts/`. The variable `wght` axis (400–800) is kept, so one file serves weights 400, 700 and 800. Result on 25-09-26: 17,980 bytes (fonttools 4.60.2, Python 3.9.13).

## When to re-run

Whenever a new on-screen string uses a character outside the subset: anything beyond printable ASCII, `×` (U+00D7), `—` (U+2014) or `−` (U+2212). Add the code point to `--unicodes` and keep the output file name, since `theme.font.file` points at it.

---

## Decision Log

### [25-09-26] — Font subset recipe recorded
- **Added:** Source URLs, licence line, the exact `fontTools.subset` command and re-run rule.
- **Notes:** Source is Google Fonts' `Baloo2[wght].ttf` (SIL OFL 1.1). Glyph set: printable ASCII plus `×`, `—`, `−`. `tnum` dropped on purpose: Canvas 2D cannot enable OpenType features, and the HUD draws tabular digits itself (art plan Task 6).
