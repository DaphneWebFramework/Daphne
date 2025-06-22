##
# DeployRootStage.py
#
# (C) 2025 by Eylem Ugurel
#
# Licensed under a Creative Commons Attribution 4.0 International License.
#
# You should have received a copy of the license along with this work. If not,
# see <http://creativecommons.org/licenses/by/4.0/>.
##

from .Context import Context
from .Stage import Stage

class DeployRootStage(Stage):
    _SOURCE_CONFIG_FILENAME = 'config.live.php'
    _TARGET_CONFIG_FILENAME = 'config.php'

    def run(self, context: Context) -> None:
        for sourceFilePath in context.sourceDirectoryPath.iterdir():
            if sourceFilePath.is_dir():
                continue
            if sourceFilePath.name == self._TARGET_CONFIG_FILENAME:
                # Don't copy developer's config file
                continue
            if sourceFilePath.name == self._SOURCE_CONFIG_FILENAME:
                # Copy live config as default config
                targetFileName = self._TARGET_CONFIG_FILENAME
            else:
                # Copy other files as they are
                targetFileName = sourceFilePath.name
            context.copier.copyFile(
                sourceFilePath,
                context.targetDirectoryPath / targetFileName,
                createTargetDirectory = False
            )

    def status(self) -> str:
        return 'Deploying root files...'
