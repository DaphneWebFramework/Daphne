##
# DeployFrontendStage.py
#
# (C) 2025 by Eylem Ugurel
#
# Licensed under a Creative Commons Attribution 4.0 International License.
#
# You should have received a copy of the license along with this work. If not,
# see <http://creativecommons.org/licenses/by/4.0/>.
##

from .Context import Context
from .ManifestService import ManifestService, ManifestBlock
from .Stage import Stage
from .Utility import Utility
from pathlib import Path

class DeployFrontendStage(Stage):
    _SUBDIRECTORY_NAME = 'frontend'
    _MANIFEST_FILENAME = 'manifest.json'
    _ASSET_TYPE_JS = 'js'
    _ASSET_TYPE_CSS = 'css'

    def run(self, context: Context) -> None:
        sourceSubdirectoryPath = (
            context.sourceDirectoryPath / self._SUBDIRECTORY_NAME)
        targetSubdirectoryPath = (
            context.targetDirectoryPath / self._SUBDIRECTORY_NAME)
        # 1. Load and deploy manifest-declared assets.
        manifestBlocks = ManifestService.loadFrontendManifest(
            sourceSubdirectoryPath / self._MANIFEST_FILENAME)
        for _, manifestBlock in manifestBlocks.items():
            self._deployManifestBlock(
                context,
                manifestBlock,
                sourceSubdirectoryPath,
                targetSubdirectoryPath
            )
        # 2. Save a minified copy of "manifest.json".
        ManifestService.saveFrontendManifest(
            manifestBlocks,
            targetSubdirectoryPath / self._MANIFEST_FILENAME
        )
        # 3. Copy remaining files (images, fonts, etc.) excluding js/css and the
        #    manifest file.
        context.copier.copyFilesRecursive(
            sourceSubdirectoryPath,
            targetSubdirectoryPath,
            excludePatterns={'*.js', '*.css', self._MANIFEST_FILENAME}
        )

    def status(self) -> str:
        return f"Deploying '{self._SUBDIRECTORY_NAME}' directory..."

    #region private ------------------------------------------------------------

    def _deployManifestBlock(
        self,
        context: Context,
        manifestBlock: ManifestBlock,
        sourceSubdirectoryPath: Path,
        targetSubdirectoryPath: Path
    ) -> None:
        for assetType in [self._ASSET_TYPE_JS, self._ASSET_TYPE_CSS]:
            assetPaths = getattr(manifestBlock, assetType)
            if assetPaths is None:
                continue
            self._deployAssetGroup(
                context,
                assetType,
                Utility.ensureList(assetPaths),
                sourceSubdirectoryPath,
                targetSubdirectoryPath
            )

    def _deployAssetGroup(
        self,
        context: Context,
        assetType: str,
        assetPaths: list[str],
        sourceSubdirectoryPath: Path,
        targetSubdirectoryPath: Path
    ) -> None:
        for assetPath in assetPaths:
            if Utility.isUrl(assetPath):
                # Skip URLs (e.g. CDN links)
                continue
            self._deployAsset(
                context,
                assetType,
                Path(assetPath),
                sourceSubdirectoryPath,
                targetSubdirectoryPath
            )

    def _deployAsset(
        self,
        context: Context,
        assetType: str,
        assetPath: Path,
        sourceSubdirectoryPath: Path,
        targetSubdirectoryPath: Path
    ) -> None:
        # If the asset path has an explicit suffix (".js", ".min.js", ".css", or
        # ".min.css"), simply copy it as-is without transformation. This respects
        # the author's intent - either they provided only a minified file, or
        # deliberately chose not to apply minification.
        if assetPath.suffix == f'.{assetType}':
            context.copier.copyFile(
                sourceSubdirectoryPath / assetPath,
                targetSubdirectoryPath / assetPath
            )
            return
        # If the asset path is suffixless, resolve it to a minified variant by
        # appending ".min.js" or ".min.css", and if that file exists, copy it.
        minifiedAssetPath = Utility.addSuffix(assetPath, assetType, isMinified=True)
        sourceMinifiedAssetPath = sourceSubdirectoryPath / minifiedAssetPath
        targetMinifiedAssetPath = targetSubdirectoryPath / minifiedAssetPath
        if sourceMinifiedAssetPath.is_file():
            context.copier.copyFile(
                sourceMinifiedAssetPath,
                targetMinifiedAssetPath
            )
            return
        # If the minified variant is missing but the unminified file exists,
        # minify it to a file with a ".min.js" or ".min.css" suffix. This supports
        # assets that are under active development, where pre-minified versions
        # are not maintained.
        unminifiedAssetPath = Utility.addSuffix(assetPath, assetType, isMinified=False)
        sourceUnminifiedAssetPath = sourceSubdirectoryPath / unminifiedAssetPath
        if sourceUnminifiedAssetPath.is_file():
            self._minifyAsset(
                context,
                assetType,
                sourceUnminifiedAssetPath,
                targetMinifiedAssetPath
            )
            return
        # If neither the minified nor the unminified file exists, raise
        # an error.
        raise FileNotFoundError(
            f'Missing file: {sourceMinifiedAssetPath} or {sourceUnminifiedAssetPath}')

    def _minifyAsset(
        self,
        context: Context,
        assetType: str,
        sourceAssetPath: Path,
        targetAssetPath: Path
    ) -> None:
        if context.ignoreRules.isIgnored(sourceAssetPath):
            return
        if assetType == self._ASSET_TYPE_JS:
            context.minifier.minifyJs(sourceAssetPath, targetAssetPath)
        elif assetType == self._ASSET_TYPE_CSS:
            context.minifier.minifyCss(sourceAssetPath, targetAssetPath)
        else:
            raise ValueError(f'Unknown asset type: {assetType}')

    #endregion private
