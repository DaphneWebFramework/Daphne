##
# CreateTargetDirectoryStage.py
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
from datetime import datetime
from pathlib import Path

class CreateTargetDirectoryStage(Stage):
    def run(self, context: Context) -> None:
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        context.targetDirectoryPath /= timestamp
        context.targetDirectoryPath.mkdir(parents=True, exist_ok=False)

    def status(self) -> str:
        return 'Creating target directory...'
