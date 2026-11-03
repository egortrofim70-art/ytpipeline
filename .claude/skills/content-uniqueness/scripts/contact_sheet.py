#!/usr/bin/env python3
"""
Build a contact sheet (grid of frames) from a reference video, so pacing
and composition can be scanned at a glance instead of scrubbing through
the whole clip. Matches the "contact sheets" step creators use when
batch-studying a pile of competitor videos before writing a script.

Usage:
    python3 -E contact_sheet.py input.mp4 out.jpg [--cols 6] [--interval 2]

--interval: seconds between sampled frames (default 2s, i.e. every other
second of a 30s short gives a 15-frame sheet).
--cols: frames per row in the output grid (default 6).

Requires ffmpeg on PATH (already installed in this environment).
"""
import argparse
import subprocess
import sys
from pathlib import Path


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("input", type=Path)
    ap.add_argument("output", type=Path)
    ap.add_argument("--interval", type=float, default=2.0, help="seconds between sampled frames (default 2.0)")
    ap.add_argument("--cols", type=int, default=6, help="frames per row (default 6)")
    args = ap.parse_args()

    if not args.input.exists():
        print(f"error: {args.input} not found", file=sys.stderr)
        return 1

    fps = 1.0 / args.interval
    vf = f"fps={fps},scale=320:-1,tile={args.cols}x999"
    cmd = [
        "ffmpeg", "-y", "-i", str(args.input),
        "-vf", vf,
        "-frames:v", "1",
        str(args.output),
    ]
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        print(result.stderr[-2000:], file=sys.stderr)
        return result.returncode

    print(f"contact sheet written to {args.output} (one frame every {args.interval}s, {args.cols} cols)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
