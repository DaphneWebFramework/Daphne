##
# Esbuild.py
#
# (C) 2025 by Eylem Ugurel
#
# Licensed under a Creative Commons Attribution 4.0 International License.
#
# You should have received a copy of the license along with this work. If not,
# see <http://creativecommons.org/licenses/by/4.0/>.
##

from pathlib import Path
import subprocess

class Esbuild:
    _executablePath: Path

    def __init__(self, rootDirectoryPath: Path):
        self._executablePath = (
            rootDirectoryPath /
            'esbuild' /
            'win32-x64-0.25.5' /
            'esbuild.exe'
        )

    def run(
        self,
        inputFilePath: Path,
        outputFilePath: Path,
        *,
        minify: bool = True
    ) -> None:
        command = [
            str(self._executablePath),
            str(inputFilePath),
            f'--outfile={outputFilePath}',
            '--log-level=warning'
        ]
        if minify:
            command.append('--minify')
        subprocess.run(command, check=True)
