##
# IgnoreRules.py
#
# (C) 2025 by Eylem Ugurel
#
# Licensed under a Creative Commons Attribution 4.0 International License.
#
# You should have received a copy of the license along with this work. If not,
# see <http://creativecommons.org/licenses/by/4.0/>.
##

from fnmatch import fnmatch
from pathlib import Path
from typing import List

class IgnoreRules:
    _IGNORE_FILENAME: str = '.deployignore'
    _baseDirectoryPath: Path
    _ignoredPatterns: List[str]
    _ignoredDirectoryPaths: List[str]

    def __init__(self, baseDirectoryPath: Path):
        self._baseDirectoryPath = baseDirectoryPath.resolve()
        self._ignoredPatterns = []
        self._ignoredDirectoryPaths = []
        ignoreFilePath = self._baseDirectoryPath / self._IGNORE_FILENAME
        if ignoreFilePath.exists():
            with ignoreFilePath.open(encoding='utf-8') as file:
                for line in file:
                    rule = line.strip()
                    if not rule or rule.startswith('#'):
                        continue  # Skip empty lines and comments
                    rule = rule.replace('\\', '/')
                    if rule.endswith('/') and '*' not in rule and '?' not in rule:
                        self._ignoredDirectoryPaths.append(rule.rstrip('/'))
                    else:
                        self._ignoredPatterns.append(rule)
        # Always exclude the ".deployignore" file from deployment
        self._ignoredPatterns.append(self._IGNORE_FILENAME)

    def isIgnored(self, path: Path) -> bool:
        if path.is_absolute():
            try:
                path = path.relative_to(self._baseDirectoryPath)
            except ValueError:
                return False  # path is outside of base directory
        path = str(path).replace('\\', '/')
        for pattern in self._ignoredPatterns:
            if fnmatch(path, pattern):
                return True
        for directoryPath in self._ignoredDirectoryPaths:
            if path == directoryPath or path.startswith(directoryPath + '/'):
                return True
        return False
