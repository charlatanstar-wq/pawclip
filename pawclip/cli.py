"""pawclip command line interface."""
import argparse
import json
import os
import sys
import time

from . import __version__
from .guard import check
from .templates import TEMPLATES, build_prompt

STATE_FILE = ".pawclip-state.json"


def load_storyboard(path):
    with open(path, encoding="utf-8") as f:
        data = json.load(f)
    shots = data["shots"] if isinstance(data, dict) else data
    defaults = data.get("defaults", {}) if isinstance(data, dict) else {}
    out = []
    for i, s in enumerate(shots, 1):
        merged = {**defaults, **s}
        merged.setdefault("id", f"{i:02d}")
        out.append(merged)
    return out


def load_state(outdir):
    p = os.path.join(outdir, STATE_FILE)
    return json.load(open(p)) if os.path.exists(p) else {}


def save_state(outdir, state):
    os.makedirs(outdir, exist_ok=True)
    with open(os.path.join(outdir, STATE_FILE), "w") as f:
        json.dump(state, f, indent=1, ensure_ascii=False)


def shot_params(shot, args, base_dir):
    prompt = build_prompt(shot.get("prompt"), shot.get("template"),
                          shot.get("pet", "cat"), shot.get("place", "living room"),
                          style=not args.no_style, lang=shot.get("lang", args.lang))
    params = {
        "model": args.model,
        "prompt": prompt,
        "duration": int(shot.get("duration", 5)),
        "resolution": shot.get("resolution", args.resolution),
        "audio": bool(shot.get("audio", True)),
        "off_peak": bool(shot.get("off_peak", args.off_peak)),
    }
    image = shot.get("image")
    if image and not image.startswith(("http://", "https://")):
        image = os.path.join(base_dir, image)
    if not image:
        params["aspect_ratio"] = shot.get("aspect_ratio", args.aspect_ratio)
    return params, image


def cmd_templates(_args):
    for k in sorted(TEMPLATES):
        print(f"{k:12} {TEMPLATES[k]}")


def cmd_plan(args):
    shots = load_storyboard(args.storyboard)
    base = os.path.dirname(os.path.abspath(args.storyboard))
    for s in shots:
        params, image = shot_params(s, args, base)
        kind = "img2video" if image else "text2video"
        print(f"[{s['id']}] {kind} {params['duration']}s {params['resolution']}\n    {params['prompt']}")
    ok, msg = check(shots, args.model, args.max_credits, rate=args.rate,
                    allow_preview=args.allow_preview)
    print(("OK: " if ok else "BLOCKED: ") + msg)
    return 0 if ok else 2


def cmd_run(args):
    from .vidu import ViduClient, ViduError
    shots = load_storyboard(args.storyboard)
    base = os.path.dirname(os.path.abspath(args.storyboard))
    state = load_state(args.out)
    todo = [s for s in shots if s["id"] not in state]
    if not todo:
        print("Nothing to submit; every shot already has a task. Use `pawclip fetch`.")
        return 0
    client = ViduClient(args.api_key)
    remaining = client.credits_remaining()
    ok, msg = check(todo, args.model, args.max_credits, remaining, args.rate, args.allow_preview)
    print(("OK: " if ok else "BLOCKED: ") + msg)
    if not ok:
        return 2
    if not args.yes:
        if input(f"Submit {len(todo)} shot(s)? [y/N] ").strip().lower() != "y":
            print("Cancelled; nothing was submitted.")
            return 1
    for s in todo:
        params, image = shot_params(s, args, base)
        try:
            r = client.img2video(image, **params) if image else client.text2video(**params)
        except ViduError as e:
            print(f"[{s['id']}] failed: {e}")
            if "Credit" in str(e):
                print("Out of credits; stopping so nothing else is charged.")
                break
            continue
        state[s["id"]] = {"task_id": r.get("task_id"), "state": r.get("state"),
                          "credits": r.get("credits")}
        save_state(args.out, state)
        print(f"[{s['id']}] task {r.get('task_id')} {r.get('state')} credits={r.get('credits')}")
    return cmd_fetch(args) if args.wait else 0


def cmd_fetch(args):
    from .vidu import ViduClient, download
    client = ViduClient(args.api_key)
    state = load_state(args.out)
    deadline = time.time() + (args.timeout if getattr(args, "wait", True) else 0)
    while True:
        pending = 0
        for sid, t in state.items():
            if t.get("file") or not t.get("task_id"):
                continue
            d = client.task(t["task_id"])
            t["state"] = d.get("state")
            if d.get("state") == "success" and d.get("creations"):
                dest = os.path.join(args.out, f"{sid}.mp4")
                download(d["creations"][0]["url"], dest)
                t["file"] = dest
                print(f"[{sid}] saved {dest}")
            elif d.get("state") == "failed":
                t["error"] = d.get("err_code")
                print(f"[{sid}] failed: {d.get('err_code')}")
            else:
                pending += 1
        save_state(args.out, state)
        if not pending or time.time() > deadline:
            if pending:
                print(f"{pending} shot(s) still running; run `pawclip fetch` again later.")
            return 0
        time.sleep(10)


def cmd_credits(args):
    from .vidu import ViduClient
    print(ViduClient(args.api_key).credits_remaining())


def main(argv=None):
    p = argparse.ArgumentParser(prog="pawclip", description="Batch AI pet videos with the Vidu API, with a credit guard.")
    p.add_argument("--version", action="version", version=__version__)
    sub = p.add_subparsers(dest="cmd", required=True)

    def common(sp):
        sp.add_argument("storyboard", help="storyboard JSON file")
        sp.add_argument("--model", default="viduq3-turbo")
        sp.add_argument("--resolution", default="540p")
        sp.add_argument("--aspect-ratio", default="9:16")
        sp.add_argument("--lang", choices=["en", "zh"], default="en")
        sp.add_argument("--no-style", action="store_true", help="do not append the realism suffix")
        sp.add_argument("--off-peak", action="store_true", help="use Vidu off-peak mode (cheaper, up to 48h)")
        sp.add_argument("--max-credits", type=float, default=None, help="refuse to run above this estimate")
        sp.add_argument("--rate", type=float, default=None, help="override credits-per-second estimate")
        sp.add_argument("--allow-preview", action="store_true", help="allow preview models such as viduq4")

    sp = sub.add_parser("plan", help="show prompts and estimated credits; calls no API")
    common(sp); sp.set_defaults(func=cmd_plan)

    sp = sub.add_parser("run", help="check credits, submit shots, optionally wait and download")
    common(sp)
    sp.add_argument("--out", default="out")
    sp.add_argument("--api-key")
    sp.add_argument("-y", "--yes", action="store_true", help="skip the confirmation prompt")
    sp.add_argument("--wait", action="store_true")
    sp.add_argument("--timeout", type=int, default=1800)
    sp.set_defaults(func=cmd_run)

    sp = sub.add_parser("fetch", help="poll submitted tasks and download finished videos")
    sp.add_argument("--out", default="out")
    sp.add_argument("--api-key")
    sp.add_argument("--timeout", type=int, default=1800)
    sp.set_defaults(func=cmd_fetch, wait=True)

    sp = sub.add_parser("credits", help="print remaining Vidu API credits")
    sp.add_argument("--api-key"); sp.set_defaults(func=cmd_credits)

    sp = sub.add_parser("templates", help="list built-in pet scene templates")
    sp.set_defaults(func=cmd_templates)

    args = p.parse_args(argv)
    return args.func(args) or 0


if __name__ == "__main__":
    sys.exit(main())
