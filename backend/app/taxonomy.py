"""
taxonomy.py
-----------
Loads the skill taxonomy and provides skill detection/normalization.

The taxonomy maps a CANONICAL skill name -> list of aliases.
We invert it into alias -> canonical so any spelling resolves to one skill.
"""

import json
import re
from pathlib import Path

DATA_PATH = Path(__file__).parent / "data" / "skills.json"


class SkillTaxonomy:
    def __init__(self, data_path: Path = DATA_PATH):
        with open(data_path, "r", encoding="utf-8") as f:
            self.canonical_to_aliases: dict[str, list[str]] = json.load(f)

        # Inverted index: every alias (lowercased) -> canonical skill.
        self.alias_to_canonical: dict[str, str] = {}
        for canonical, aliases in self.canonical_to_aliases.items():
            for alias in aliases:
                self.alias_to_canonical[alias.lower()] = canonical

        # Pre-sort aliases longest-first so "google cloud platform" is tried
        # before "gcp"/"google" when scanning text (avoids partial shadowing).
        self.all_aliases = sorted(
            self.alias_to_canonical.keys(), key=len, reverse=True
        )

    def detect_skills(self, text: str) -> set[str]:
        """Return the set of canonical skills explicitly present in `text`.

        We match on word boundaries so 'java' doesn't fire inside 'javascript',
        and we escape aliases because some contain regex-special chars (c++, c#).
        """
        text_lower = text.lower()
        found: set[str] = set()
        for alias in self.all_aliases:
            # \b doesn't work around '+'/'#', so we use a custom boundary check.
            pattern = r"(?<![a-z0-9+#.])" + re.escape(alias) + r"(?![a-z0-9+#])"
            if re.search(pattern, text_lower):
                found.add(self.alias_to_canonical[alias])
        return found

    def aliases_for(self, canonical: str) -> list[str]:
        return self.canonical_to_aliases.get(canonical, [canonical])
