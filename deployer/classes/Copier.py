##
# Copier.py
#
# (C) 2025 by Eylem Ugurel
#
# Licensed under a Creative Commons Attribution 4.0 International License.
#
# You should have received a copy of the license along with this work. If not,
# see <http://creativecommons.org/licenses/by/4.0/>.
##

from .IgnoreRules import IgnoreRules
from pathlib import Path
from shutil import copy2

class Copier:
    _ignoreRules: IgnoreRules

    def __init__(self, ignoreRules: IgnoreRules):
        self._ignoreRules = ignoreRules

    def copyFile(
        self,
        sourceFilePath: Path,
        targetFilePath: Path,
        *,
        createTargetDirectory: bool = True
    ) -> None:
        if self._ignoreRules.isIgnored(sourceFilePath):
            return
        if sourceFilePath.is_symlink():
            print(f'Warning: Skipping symlink: {sourceFilePath}')
            return
        if not sourceFilePath.is_file():
            raise FileNotFoundError(f'Missing file: {sourceFilePath}')
        if createTargetDirectory:
            targetFilePath.parent.mkdir(parents=True, exist_ok=True)
        copy2(sourceFilePath, targetFilePath)

    def copyFilesRecursive(
        self,
        sourceDirectoryPath: Path,
        targetDirectoryPath: Path,
        *,
        excludeSuffixes: set[str] = None
    ) -> None:
        for sourceFilePath in sourceDirectoryPath.rglob('*'):
            if sourceFilePath.is_dir():
                continue
            if excludeSuffixes and sourceFilePath.suffix in excludeSuffixes:
                continue
            relativePath = sourceFilePath.relative_to(sourceDirectoryPath)
            targetFilePath = targetDirectoryPath / relativePath
            self.copyFile(sourceFilePath, targetFilePath)
