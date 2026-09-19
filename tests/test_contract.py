from pathlib import Path

import yaml

ROOT = Path(__file__).parents[1]


def load(path: Path) -> dict:
    return yaml.safe_load(path.read_text())


def test_golden_path_validates_governed_inputs():
    template = load(ROOT / "templates/production-api/template.yaml")
    properties = template["spec"]["parameters"][0]["properties"]
    assert properties["name"]["pattern"]
    assert "team-checkout" in properties["owner"]["enum"]


def test_production_standard_has_non_optional_ownership_and_slo():
    standard = load(ROOT / "standards/production-readiness.yaml")
    assert {"owner", "slo_profile"} <= set(standard["mandatory"])
