"""Prompt templates tuned for realistic, natural-looking pet footage."""

# Appended to every prompt unless --no-style is used. Pushes the model toward
# handheld, real-life footage instead of glossy "cinematic" output.
REALISM_SUFFIX = (
    "Realistic handheld phone footage, natural daylight, true-to-life fur texture, "
    "natural animal motion and physics, no text, no subtitles, no music, "
    "only ambient sound."
)
REALISM_SUFFIX_ZH = (
    "真实手机随手拍质感，自然光，毛发细节真实，动物动作自然符合物理规律，"
    "不要文字，不要字幕，不要配乐，只保留环境音。"
)

TEMPLATES = {
    "zoomies": "A {pet} suddenly sprints in circles around the {place}, skidding on the floor, ears flapping, then flops down panting.",
    "head-tilt": "Close-up of a {pet} tilting its head left and right while listening to a squeaky sound off camera in the {place}.",
    "sleepy": "A {pet} slowly falls asleep while sitting up in the {place}, head drooping, eyes closing, then wakes with a tiny jolt.",
    "snack-thief": "A {pet} sneaks toward a snack on the table in the {place}, looks back at the camera guiltily, then grabs it and runs.",
    "first-snow": "A {pet} steps into fresh snow for the first time in the {place}, sniffs it, sneezes, then hops around excitedly.",
    "mirror": "A {pet} sees its reflection in a mirror in the {place}, paws at it, looks behind the mirror, confused.",
    "box": "A {pet} squeezes itself into a cardboard box much too small for it in the {place}, looking proud.",
    "bath": "A wet {pet} shakes off water in the {place}, droplets flying, fur sticking out in all directions.",
}


def build_prompt(text=None, template=None, pet="cat", place="living room",
                 style=True, lang="en"):
    """Return the final prompt for one shot.

    Either `text` (a free-form prompt) or `template` (a key of TEMPLATES) is used.
    """
    if template:
        if template not in TEMPLATES:
            raise KeyError(f"unknown template '{template}'. Available: {', '.join(sorted(TEMPLATES))}")
        base = TEMPLATES[template].format(pet=pet, place=place)
    elif text:
        base = text.strip()
    else:
        raise ValueError("a shot needs either 'prompt' or 'template'")
    if not style:
        return base
    suffix = REALISM_SUFFIX_ZH if lang == "zh" else REALISM_SUFFIX
    sep = "" if base.endswith(("。", ".", "!", "！")) else ("。" if lang == "zh" else ".")
    return f"{base}{sep} {suffix}" if lang != "zh" else f"{base}{sep}{suffix}"
