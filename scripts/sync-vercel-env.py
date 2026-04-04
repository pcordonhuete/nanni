#!/usr/bin/env python3
"""
Push .env.local + NEXT_PUBLIC_APP_URL to Vercel.

- Production: full set (Stripe secrets allowed).
- Development: non-sensitive only (Vercel blocks --sensitive on Development).
- Preview: requires a real git branch name as 3rd CLI arg, e.g. vercel-preview.
  Deployments from other branches will not see those values unless you duplicate
  them in the Vercel dashboard for “All preview branches” or per branch.
"""
from __future__ import annotations

import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
VERCEL = str(ROOT / "node_modules" / ".bin" / "vercel")


def parse_env(path: Path) -> dict[str, str]:
    out: dict[str, str] = {}
    for line in path.read_text().splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        k, v = line.split("=", 1)
        out[k.strip()] = v.strip()
    return out


def run_add(key: str, value: str, target: str, *, sensitive: bool, git_branch: str | None) -> int:
    cmd = [
        VERCEL,
        "env",
        "add",
        key,
        target,
        *( [git_branch] if git_branch else [] ),
        "--value",
        value,
        "--yes",
        "--force",
        "--non-interactive",
    ]
    if sensitive:
        cmd.append("--sensitive")
    r = subprocess.run(cmd, cwd=ROOT, capture_output=True, text=True)
    if r.returncode != 0:
        print(r.stderr or r.stdout, file=sys.stderr)
    else:
        print(f"OK {key} -> {target}" + (f" ({git_branch})" if git_branch else ""))
    return r.returncode


def main() -> int:
    env_path = ROOT / ".env.local"
    if not env_path.exists():
        print("Missing .env.local", file=sys.stderr)
        return 1
    env = parse_env(env_path)
    env["NEXT_PUBLIC_APP_URL"] = "https://nanniapp.com"
    sensitive = {"STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET"}
    code = 0
    for target in ("production", "development"):
        for key, value in sorted(env.items()):
            if not value:
                continue
            is_s = key in sensitive
            if target == "development" and is_s:
                continue
            c = run_add(key, value, target, sensitive=is_s, git_branch=None)
            code |= c
    # Optional: sync Preview for branch vercel-preview (must exist on GitHub)
    if "--preview-branch" in sys.argv:
        branch = "vercel-preview"
        for key, value in sorted(env.items()):
            if not value:
                continue
            c = run_add(
                key, value, "preview", sensitive=key in sensitive, git_branch=branch
            )
            code |= c
    return code


if __name__ == "__main__":
    raise SystemExit(main())
