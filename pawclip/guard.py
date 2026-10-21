"""Credit guard: estimate cost before anything is submitted, refuse to overspend."""

# Rough credits-per-second estimates used only for the pre-flight check.
# Real cost is whatever Vidu reports; tune with --rate if pricing changes.
DEFAULT_RATES = {
    "viduq3-turbo": 1.0,
    "viduq3-pro": 2.0,
    "viduq2-turbo": 1.0,
    "viduq2-pro": 2.0,
    "viduq1": 1.0,
}
BLOCKED_BY_DEFAULT = ("viduq4",)  # preview models burn credits fast


def estimate(shots, model, rate=None):
    per_sec = rate if rate is not None else DEFAULT_RATES.get(model, 2.0)
    return sum(int(s.get("duration", 5)) for s in shots) * per_sec


def check(shots, model, budget, remaining=None, rate=None, allow_preview=False):
    """Return (ok, message). Never raises; the caller decides what to do."""
    if not allow_preview and model.startswith(BLOCKED_BY_DEFAULT):
        return False, f"{model} is blocked by default (use --allow-preview to override)"
    cost = estimate(shots, model, rate)
    if budget is not None and cost > budget:
        return False, f"estimated {cost:g} credits exceeds --max-credits {budget:g}"
    if remaining is not None and cost > remaining:
        return False, f"estimated {cost:g} credits but only {remaining} left on the account"
    return True, f"estimated {cost:g} credits" + (f" of {remaining} left" if remaining is not None else "")
