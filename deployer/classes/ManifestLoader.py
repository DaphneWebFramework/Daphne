##
# ManifestLoader.py
#
# (C) 2025 by Eylem Ugurel
#
# Licensed under a Creative Commons Attribution 4.0 International License.
#
# You should have received a copy of the license along with this work. If not,
# see <http://creativecommons.org/licenses/by/4.0/>.
##

from dataclasses import dataclass
from pathlib import Path
import json

TManifestValue = str | list[str]

@dataclass
class ManifestBlock:
    css: TManifestValue | None
    js: TManifestValue | None

class ManifestLoader:
    @classmethod
    def loadPageManifest(cls, path: Path) -> ManifestBlock:
        data = cls._loadJson(path)
        return cls._parseBlock(data)

    @classmethod
    def loadFrontendManifest(cls, path: Path) -> dict[str, ManifestBlock]:
        data = cls._loadJson(path)
        result: dict[str, ManifestBlock] = {}
        for name, block in data.items():
            if not name:
                raise ValueError('Library name cannot be empty.')
            if not isinstance(block, dict):
                raise ValueError('Library block must be a JSON object.')
            result[name] = cls._parseBlock(block)
        return result

    @classmethod
    def _parseBlock(cls, block: dict[str, object]) -> ManifestBlock:
        return ManifestBlock(
            css = cls._parseField(block, 'css'),
            js = cls._parseField(block, 'js')
        )

    @classmethod
    def _parseField(cls, block: dict[str, object], key: str) -> TManifestValue | None:
        if key not in block:
            return None
        return cls._parseValue(block[key], key)

    @classmethod
    def _parseValue(cls, value: object, key: str) -> TManifestValue:
        if isinstance(value, str):
            value = value.strip()
            if (value == ''):
                raise ValueError(f'Field "{key}" contains an empty string.')
            return value
        if isinstance(value, list):
            if not value:
                raise ValueError(f'Field "{key}" contains an empty array.')
            for element in value:
                if not isinstance(element, str):
                    raise ValueError(f'Field "{key}" must be an array of strings.')
                element = element.strip()
                if element == '':
                    raise ValueError(f'Field "{key}" contains an empty string in the array.')
            return value
        raise ValueError(f'Field "{key}" must be a string or an array of strings.')

    @classmethod
    def _loadJson(cls, path: Path) -> dict[str, object]:
        if not path.is_file():
            raise FileNotFoundError(f'Manifest file not found: {path}')
        with open(path, 'r', encoding='utf-8') as file:
            data = json.load(file)
        if not isinstance(data, dict):
            raise ValueError('Manifest file must contain a JSON object.')
        return data
