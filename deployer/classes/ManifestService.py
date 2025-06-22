##
# ManifestService.py
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
    # 1. The "default" field is not used by deployment logic, but retained to
    #    help ensure no fields are missing when minifying frontend manifests.
    # 2. Although not used in page manifests, the "default" field is present to
    #    avoid splitting manifest parsing into separate dataclasses; it has no
    #    impact on page deployment logic.
    # 3. Trailing underscore avoids conflict with the reserved keyword `default`.
    default_: bool | None = None

class ManifestService:
    @classmethod
    def loadPageManifest(
        cls,
        path: Path
    ) -> ManifestBlock:
        data = cls._loadJson(path)
        return cls._parseBlock(data)

    @classmethod
    def loadFrontendManifest(
        cls,
        path: Path
    ) -> dict[str, ManifestBlock]:
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
    def saveFrontendManifest(
        cls,
        manifestBlocks: dict[str, ManifestBlock],
        path: Path
    ) -> None:
        with open(path, 'w', encoding='utf-8') as file:
            json.dump({
                name: {
                    key: value
                    for key, value in {
                        "css": block.css,
                        "js": block.js,
                        "default": block.default_
                    }.items() if value is not None
                }
                for name, block in manifestBlocks.items()
            }, file, separators=(',', ':'))

    #region private ------------------------------------------------------------

    @classmethod
    def _loadJson(cls, path: Path) -> dict[str, object]:
        if not path.is_file():
            raise FileNotFoundError(f'Manifest file not found: {path}')
        with open(path, 'r', encoding='utf-8') as file:
            data = json.load(file)
        if not isinstance(data, dict):
            raise ValueError('Manifest file must contain a JSON object.')
        return data

    @classmethod
    def _parseBlock(
        cls,
        block: dict[str, object]
    ) -> ManifestBlock:
        return ManifestBlock(
            css = cls._parseAssetBlock(block, 'css'),
            js = cls._parseAssetBlock(block, 'js'),
            default_ = cls._parseBooleanValue(block, 'default')
        )

    @classmethod
    def _parseAssetBlock(
        cls,
        block: dict[str, object],
        key: str
    ) -> TManifestValue | None:
        if key not in block:
            return None
        return cls._parseAssetValue(block[key], key)

    @classmethod
    def _parseAssetValue(
        cls,
        value: object,
        key: str
    ) -> TManifestValue:
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
    def _parseBooleanValue(
        cls,
        block: dict[str, object],
        key: str
    ) -> bool | None:
        if key not in block:
            return None
        value = block[key]
        if not isinstance(value, bool):
            raise ValueError(f'Field "{key}" must be a boolean.')
        return value

    #endregion private
