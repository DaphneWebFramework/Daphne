##
# Minifier.py
#
# (C) 2025 by Eylem Ugurel
#
# Licensed under a Creative Commons Attribution 4.0 International License.
#
# You should have received a copy of the license along with this work. If not,
# see <http://creativecommons.org/licenses/by/4.0/>.
##

from .Esbuild import Esbuild
from pathlib import Path
import uuid

class Minifier:
    _esbuild: Esbuild

    def __init__(self, rootPath: Path):
        self._esbuild = Esbuild(rootPath)

    def minifyJs(
        self,
        inputFilePathOrPaths: Path | list[Path],
        outputFilePath: Path
    ) -> None:
        self._minify(inputFilePathOrPaths, outputFilePath, suffix='js')

    def minifyCss(
        self,
        inputFilePathOrPaths: Path | list[Path],
        outputFilePath: Path
    ) -> None:
        self._minify(inputFilePathOrPaths, outputFilePath, suffix='css')

    def _minify(
        self,
        inputFilePathOrPaths: Path | list[Path],
        outputFilePath: Path,
        *,
        suffix: str
    ) -> None:
        # Ensure the output directory exists.
        outputFilePath.parent.mkdir(parents=True, exist_ok=True)
        # If there's only one input file, run esbuild directly.
        if isinstance(inputFilePathOrPaths, Path):
            self._esbuild.run(inputFilePathOrPaths, outputFilePath)
            return
        # If there are multiple input files, create a temporary file by
        # concatenating their contents and then run esbuild on it. Note
        # that the temporary file's suffix determines how esbuild handles
        # the input.
        tempFilePath = outputFilePath.parent / f'temp-{uuid.uuid4().hex}.{suffix}'
        try:
            with open(tempFilePath, 'w', encoding='utf-8') as tempFile:
                for inputFile in inputFilePathOrPaths:
                    with open(inputFile, 'r', encoding='utf-8') as f:
                        tempFile.write(f.read() + '\n')
            self._esbuild.run(tempFilePath, outputFilePath)
        finally:
            try:
                tempFilePath.unlink()
            except Exception as e:
                print(f'Warning: Failed to delete temporary file: {tempFilePath} ({e})')
