##
# Pipeline.py
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

class Pipeline:
    def __init__(self, stages: list[Stage]):
        self.stages = stages

    def run(self, context: Context) -> None:
        for stage in self.stages:
            try:
                print(stage.status())
                stage.run(context)
            except Exception as error:
                print(error)
                break
