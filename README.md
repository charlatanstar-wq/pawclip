# pawclip 🐾

Batch-generate realistic AI pet videos with the [Vidu API](https://platform.vidu.com), without accidentally burning your credits.

用 Vidu API 批量生成真实感 AI 萌宠视频，自带额度保护，不会一不小心把积分花光。

## Why

Making pet clips one by one in a web UI is slow, and API scripts make it easy to overspend. pawclip gives you:

- **Storyboards** – describe a whole video as a JSON list of shots (text-to-video or image-to-video).
- **Pet scene templates** – `zoomies`, `head-tilt`, `snack-thief`, `first-snow`… just fill in your pet and place.
- **Realism by default** – a style suffix pushes the model toward handheld, natural footage instead of glossy "cinematic" looks (English or 中文).
- **Credit guard** – estimates cost before submitting, checks your real balance, refuses to exceed `--max-credits`, blocks expensive preview models unless you opt in, asks for confirmation, and stops at the first out-of-credit error.
- **Resumable** – task IDs are saved, so `pawclip fetch` can download results later and re-runs never resubmit a shot.
- **Zero dependencies** – Python 3.9+ standard library only.

## Install

```bash
pip install git+https://github.com/charlatanstar-wq/pawclip
export VIDU_API_KEY=your_key
```

## Quick start

```bash
pawclip templates                              # list scene templates
pawclip plan examples/orange-cat.json          # preview prompts + cost, no API calls
pawclip credits                                # remaining credits
pawclip run examples/orange-cat.json --max-credits 20 --wait
pawclip fetch --out out                        # download finished clips later
```

## Storyboard format

```json
{
  "defaults": {"pet": "fluffy orange tabby cat", "place": "living room", "duration": 5},
  "shots": [
    {"id": "01", "template": "zoomies"},
    {"id": "02", "prompt": "The cat stares at a cucumber, then jumps straight up."},
    {"id": "03", "image": "frames/cat.png", "prompt": "The cat slowly blinks at the camera."},
    {"id": "04", "prompt": "一只橘猫趴在窗台上看雨", "lang": "zh"}
  ]
}
```

Per-shot keys: `prompt` or `template`, `pet`, `place`, `image` (path or URL → image-to-video), `duration`, `resolution`, `aspect_ratio`, `audio`, `off_peak`, `lang`.

## Options

| flag | default | |
|---|---|---|
| `--model` | `viduq3-turbo` | any Vidu video model |
| `--resolution` | `540p` | cheapest |
| `--aspect-ratio` | `9:16` | vertical, for short-video platforms |
| `--off-peak` | off | cheaper, finishes within 48h |
| `--max-credits` | none | hard cap on the estimate |
| `--allow-preview` | off | allow `viduq4*` preview models |
| `--no-style` | off | send prompts as written |

Cost estimates are approximate; check [Vidu pricing](https://platform.vidu.com/docs/overview/pricing) and tune with `--rate`.

## Contributing

Issues and PRs welcome, especially new templates and support for more video APIs.

## License

MIT
