##
# Utility.py
#
# (C) 2025 by Eylem Ugurel
#
# Licensed under a Creative Commons Attribution 4.0 International License.
#
# You should have received a copy of the license along with this work. If not,
# see <http://creativecommons.org/licenses/by/4.0/>.
##

from pathlib import Path

class Utility:
    @staticmethod
    def isUrl(value: str) -> bool:
        return value.lower().startswith(('http://', 'https://'))

    @staticmethod
    def ensureList(value: str | list[str]) -> list[str]:
        return [value] if isinstance(value, str) else value

    @staticmethod
    def normalizeSlashes(path: str | Path) -> str:
        return str(path).replace('\\', '/')

    @staticmethod
    def addSuffix(
        path: Path,
        suffix: str,
        *,
        isMinified: bool = False
    ) -> Path:
        if isMinified:
            suffix = f'.min.{suffix}'
        else:
            suffix = f'.{suffix}'
        # Note: We use `with_name` instead of `with_suffix` to correctly append
        # the desired suffix. For example, given a file named "bootstrap.bundle",
        # using `with_suffix(".min.js")` would incorrectly produce "bootstrap.min.js",
        # interpreting "bundle" as a suffix.
        return path.with_name(path.name + suffix)
