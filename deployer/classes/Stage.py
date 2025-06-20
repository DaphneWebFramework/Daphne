##
# Stage.py
#
# (C) 2025 by Eylem Ugurel
#
# Licensed under a Creative Commons Attribution 4.0 International License.
#
# You should have received a copy of the license along with this work. If not,
# see <http://creativecommons.org/licenses/by/4.0/>.
##

from .Context import Context
from abc import ABC, abstractmethod

class Stage(ABC):
    @abstractmethod
    def run(self, context: Context) -> None:
        pass

    @abstractmethod
    def status(self) -> str:
        pass
