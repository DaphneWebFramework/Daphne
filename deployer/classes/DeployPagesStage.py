##
# DeployPagesStage.py
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

class DeployPagesStage(Stage):
    _SUBDIRECTORY_NAME = 'pages'
    _MANIFEST_FILENAME = 'manifest.json'
    _TARGET_FILENAME_JS = 'page.min.js'
    _TARGET_FILENAME_CSS = 'page.min.css'
    _ASSET_TYPE_JS = 'js'
    _ASSET_TYPE_CSS = 'css'

    def run(self, context: Context) -> None:
        sourceSubdirectoryPath = (
            context.sourceDirectoryPath / self._SUBDIRECTORY_NAME)
        targetSubdirectoryPath = (
            context.targetDirectoryPath / self._SUBDIRECTORY_NAME)
        for sourcePageDirectoryPath in sourceSubdirectoryPath.iterdir():
            if not sourcePageDirectoryPath.is_dir():
                continue
            self._deployPage(
                context,
                sourcePageDirectoryPath,
                targetSubdirectoryPath / sourcePageDirectoryPath.name
            )

    def status(self) -> str:
        return f"Deploying '{self._SUBDIRECTORY_NAME}' directory..."

    #region private ------------------------------------------------------------

    def _deployPage(
        self,
        context: Context,
        sourcePageDirectoryPath: Path,
        targetPageDirectoryPath: Path
    ) -> None:
        manifestFilePath = sourcePageDirectoryPath / self._MANIFEST_FILENAME
        # Presence of page-level manifest is optional.
        if manifestFilePath.is_file():
            # 1. Load and deploy manifest-declared assets, bundling them into
            #    "page.min.js" and "page.min.css".
            manifestBlock = ManifestService.loadPageManifest(manifestFilePath)
            self._deployManifestBlock(
                context,
                manifestBlock,
                sourcePageDirectoryPath,
                targetPageDirectoryPath
            )
            # 2. Save a minified, transformed copy of "manifest.json" reflecting
            #    bundled assets.
            ManifestService.savePageManifest(
                self._transformManifestBlock(manifestBlock),
                targetPageDirectoryPath / self._MANIFEST_FILENAME
            )
        # 3. Copy remaining files (images, fonts, etc.) excluding js/css and the
        #    manifest file.
        context.copier.copyFilesRecursive(
            sourcePageDirectoryPath,
            targetPageDirectoryPath,
            excludePatterns={'*.js', '*.css', self._MANIFEST_FILENAME}
        )

    def _deployManifestBlock(
        self,
        context: Context,
        manifestBlock: ManifestBlock,
        sourcePageDirectoryPath: Path,
        targetPageDirectoryPath: Path
    ) -> None:
        for assetType in [self._ASSET_TYPE_JS, self._ASSET_TYPE_CSS]:
            assetPaths = getattr(manifestBlock, assetType)
            if assetPaths is None:
                continue
            self._deployAssetGroup(
                context,
                assetType,
                Utility.ensureList(assetPaths),
                sourcePageDirectoryPath,
                targetPageDirectoryPath
            )

    def _deployAssetGroup(
        self,
        context: Context,
        assetType: str,
        assetPaths: list[str],
        sourcePageDirectoryPath: Path,
        targetPageDirectoryPath: Path
    ) -> None:
        # All assets in the "js" or "css" group are concatenated and
        # minified into a single "page.min.js" or "page.min.css".
        targetAssetFilename = (
            self._TARGET_FILENAME_JS if assetType == self._ASSET_TYPE_JS
            else self._TARGET_FILENAME_CSS
        )
        self._deployAssets(
            context,
            assetType,
            assetPaths,
            sourcePageDirectoryPath,
            targetPageDirectoryPath / targetAssetFilename
        )

    def _deployAssets(
        self,
        context: Context,
        assetType: str,
        assetPaths: list[str],
        sourcePageDirectoryPath: Path,
        targetAssetPath: Path
    ) -> None:
        sourceAssetPaths = self._buildSourceAssetPaths(
            context,
            assetType,
            assetPaths,
            sourcePageDirectoryPath
        )
        if assetType == self._ASSET_TYPE_JS:
            context.minifier.minifyJs(sourceAssetPaths, targetAssetPath)
        elif assetType == self._ASSET_TYPE_CSS:
            context.minifier.minifyCss(sourceAssetPaths, targetAssetPath)
        else:
            raise ValueError(f'Unknown asset type: {assetType}')

    def _buildSourceAssetPaths(
        self,
        context: Context,
        assetType: str,
        assetPaths: list[str],
        sourcePageDirectoryPath: Path
    ) -> list[Path]:
        sourceAssetPaths = []
        for assetPath in assetPaths:
            if Utility.isUrl(assetPath):
                # Skip URLs (e.g. CDN links)
                continue
            assetPath = Path(assetPath)
            if not assetPath.suffix:
                # If the asset path has no suffix (e.g. "index"), append ".js"
                # or ".css" depending on the asset group it belongs to.
                assetPath = Utility.addSuffix(assetPath, assetType)
            sourceAssetPath = sourcePageDirectoryPath / assetPath
            if not sourceAssetPath.is_file():
                raise FileNotFoundError(f'Missing file: {sourceAssetPath}')
            if context.ignoreRules.isIgnored(sourceAssetPath):
                continue
            # Note that even if an asset is already minified (e.g. ends with
            # ".min.js"), it will still be combined with the others and passed
            # through the minifier.
            sourceAssetPaths.append(sourceAssetPath)
        return sourceAssetPaths

    def _transformManifestBlock(
        self,
        manifestBlock: ManifestBlock
    ) -> ManifestBlock:
        """
        Returns a new ManifestBlock with local asset references replaced by
        page.min.js/css, and remote URLs preserved. Single-item lists are
        flattened into a string if only one path remains.
        """
        def classifyAssets(assetPaths):
            remote, local = [], []
            for path in assetPaths:
                (remote if Utility.isUrl(path) else local).append(path)
            return remote, local
        def transformAssetBlock(assetPaths, targetFilename):
            assetPaths = Utility.ensureList(assetPaths or [])
            remote, local = classifyAssets(assetPaths)
            transformed = ([targetFilename] if local else []) + remote
            if not transformed:
                return None
            return transformed[0] if len(transformed) == 1 else transformed
        return ManifestBlock(
            js=transformAssetBlock(manifestBlock.js,  self._TARGET_FILENAME_JS),
            css=transformAssetBlock(manifestBlock.css, self._TARGET_FILENAME_CSS)
        )

    #endregion private
