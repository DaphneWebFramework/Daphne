##
# DeployDirectoryStage.py
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
from .Utility import Utility

class DeployDirectoryStage(Stage):
    _subdirectoryName: str

    def __init__(self, subdirectoryName: str):
        self._subdirectoryName = subdirectoryName

    def run(self, context: Context) -> None:
        Utility.copyFilesRecursive(
            context,
            context.sourceDirectoryPath / self._subdirectoryName,
            context.targetDirectoryPath / self._subdirectoryName
        )

    def status(self) -> str:
        return f"Deploying '{self._subdirectoryName}' directory..."
