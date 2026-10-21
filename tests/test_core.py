import unittest
from pawclip.templates import build_prompt, TEMPLATES
from pawclip.guard import check, estimate


class TestPrompts(unittest.TestCase):
    def test_template_fills_pet_and_place(self):
        p = build_prompt(template="zoomies", pet="corgi", place="garden")
        self.assertIn("corgi", p)
        self.assertIn("garden", p)
        self.assertIn("handheld", p)

    def test_no_style(self):
        self.assertEqual(build_prompt("A cat yawns.", style=False), "A cat yawns.")

    def test_zh_suffix(self):
        self.assertIn("环境音", build_prompt("一只猫打哈欠", lang="zh"))

    def test_unknown_template(self):
        with self.assertRaises(KeyError):
            build_prompt(template="nope")

    def test_templates_have_placeholders(self):
        for t in TEMPLATES.values():
            self.assertIn("{pet}", t)


class TestGuard(unittest.TestCase):
    shots = [{"duration": 5}, {"duration": 4}]

    def test_estimate(self):
        self.assertEqual(estimate(self.shots, "viduq3-turbo"), 9)

    def test_budget_blocks(self):
        ok, _ = check(self.shots, "viduq3-pro", budget=10)
        self.assertFalse(ok)

    def test_balance_blocks(self):
        ok, _ = check(self.shots, "viduq3-turbo", None, remaining=5)
        self.assertFalse(ok)

    def test_preview_blocked(self):
        ok, msg = check(self.shots, "viduq4-preview", None)
        self.assertFalse(ok)
        self.assertIn("allow-preview", msg)

    def test_ok(self):
        ok, _ = check(self.shots, "viduq3-turbo", 20, remaining=100)
        self.assertTrue(ok)


if __name__ == "__main__":
    unittest.main()
