##
# app.py
#
# (C) 2025 by Eylem Ugurel
#
# Licensed under a Creative Commons Attribution 4.0 International License.
#
# You should have received a copy of the license along with this work. If not,
# see <http://creativecommons.org/licenses/by/4.0/>.
##

from classes.Context import Context
from classes.CreateTargetDirectoryStage import CreateTargetDirectoryStage
from classes.DeployDirectoryStage import DeployDirectoryStage
from classes.DeployFrontendStage import DeployFrontendStage
from classes.DeployPagesStage import DeployPagesStage
from classes.DeployRootStage import DeployRootStage
from classes.Minifier import Minifier
from classes.Pipeline import Pipeline
from pathlib import Path
import argparse
import sys

def parseArgs(argv):
    parser = argparse.ArgumentParser(
        description='Deployment tool for the Daphne Web Framework.'
    )
    parser.add_argument(
        '--sourcedir',
        type=str,
        required=True,
        help=(
            'Directory containing the source files for deployment. '
            'It may include a `.deployignore` file to exclude specific '
            'files and directories.'
        )
    )
    parser.add_argument(
        '--targetdir',
        type=str,
        required=True,
        help=(
            'Directory to store the deployed files. A timestamped '
            'subdirectory (e.g., `20250617_175920`) will be created '
            'within it to store the deployed content.'
        )
    )
    return parser.parse_args(argv)

def main(argv):
    args = parseArgs(argv[1:])
    rootPath = Path(__file__).resolve().parent
    context = Context(
        sourceDirectoryPath = Path(args.sourcedir).resolve(),
        targetDirectoryPath = Path(args.targetdir).resolve(),
        minifier = Minifier(rootPath)
    )
    pipeline = Pipeline([
        CreateTargetDirectoryStage(),
        DeployDirectoryStage('assets'),
        DeployDirectoryStage('backend'),
        DeployFrontendStage(),
        DeployDirectoryStage('masterpages'),
        DeployPagesStage(),
        DeployDirectoryStage('templates'),
        DeployRootStage(),
    ])
    pipeline.run(context)
    return 0

if __name__ == '__main__':
    try:
        sys.exit(main(sys.argv))
    except Exception as e:
        print(f'Unhandled exception: {e}')
        sys.exit(1)
