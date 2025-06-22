##
# Context.py
#
# (C) 2025 by Eylem Ugurel
#
# Licensed under a Creative Commons Attribution 4.0 International License.
#
# You should have received a copy of the license along with this work. If not,
# see <http://creativecommons.org/licenses/by/4.0/>.
##

from .Copier import Copier
from .IgnoreRules import IgnoreRules
from .Minifier import Minifier
from pathlib import Path

class Context:
    sourceDirectoryPath: Path
    targetDirectoryPath: Path
    ignoreRules: IgnoreRules
    copier: Copier
    minifier: Minifier

    def __init__(
        self,
        sourceDirectoryPath: Path,
        targetDirectoryPath: Path,
        minifier: Minifier
    ):
        self.sourceDirectoryPath = sourceDirectoryPath
        self.targetDirectoryPath = targetDirectoryPath
        self.ignoreRules = IgnoreRules(sourceDirectoryPath)
        self.copier = Copier(self.ignoreRules)
        self.minifier = minifier
