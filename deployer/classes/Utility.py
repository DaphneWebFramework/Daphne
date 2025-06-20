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

from .Context import Context
from pathlib import Path
from shutil import copy2

class Utility:
    @staticmethod
    def isUrl(value: str) -> bool:
        return value.lower().startswith(('http://', 'https://'))

    @staticmethod
    def ensureList(value: str | list[str]) -> list[str]:
        return [value] if isinstance(value, str) else value

    @staticmethod
    def toTargetPath(
        sourcePath: Path,
        sourceBasePath: Path,
        targetBasePath: Path
    ) -> Path:
        relativePath = sourcePath.relative_to(sourceBasePath)
        return targetBasePath / relativePath

    @staticmethod
    def addSuffix(
        path: Path,
        suffix: str,
        *,
        isMinified: bool = False
    ) -> Path:
        # Note: We use `with_name` instead of `with_suffix` to correctly append
        # the desired suffix. For example, given a file named "bootstrap.bundle",
        # using `with_suffix(".min.js")` would incorrectly produce "bootstrap.min.js",
        # interpreting "bundle" as a suffix.
        if isMinified:
            suffix = f'.min.{suffix}'
        else:
            suffix = f'.{suffix}'
        return path.with_name(path.name + suffix)

    @staticmethod
    def copyFile(
        context: Context,
        sourceFilePath: Path,
        targetFilePath: Path,
        *,
        createTargetDirectory: bool = True
    ) -> None:
        if context.ignoreRules.isIgnored(sourceFilePath):
            return
        if sourceFilePath.is_symlink():
            print(f'Warning: Skipping symlink: {sourceFilePath}')
            return
        if not sourceFilePath.is_file():
            raise FileNotFoundError(f'Missing file: {sourceFilePath}')
        if createTargetDirectory:
            targetFilePath.parent.mkdir(parents=True, exist_ok=True)
        copy2(sourceFilePath, targetFilePath)

    @staticmethod
    def copyFilesRecursive(
        context: Context,
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
            Utility.copyFile(
                context,
                sourceFilePath,
                Utility.toTargetPath(
                    sourceFilePath,
                    sourceDirectoryPath,
                    targetDirectoryPath
                )
            )
