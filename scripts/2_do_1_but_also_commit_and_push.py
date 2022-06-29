#!/usr/bin/env python3

import argparse
import os.path
import subprocess
import sys


# Get runtime args
parser = argparse.ArgumentParser()
parser.add_argument(
    "-y",
    "--yes",
    action="store_true",
    help="say yes to everything",
)
parser.add_argument(
    "--no-commit",
    action="store_true",
    help="stage changes but don't actually commit",
)
parser.add_argument(
    "--no-push",
    action="store_true",
    help="commit but don't actually push",
)

args = parser.parse_args()

# Check for staged changes and exit if there are any
has_staged_changes = (
    subprocess.run(["git", "diff", "--cached", "--quiet"]).returncode != 0
)

if has_staged_changes:
    print("Aborting. There are staged changes in this repository.")
    sys.exit(1)

# List of paths to files we'll be modifying
paths_to_add = [
    "../index.html",
    "../data/raw",
    "../data/data.json",
    "../data/data.min.json",
    "../js/modules/dataModule.mjs",
    "../js/pokerplots.min.js",
]

# Make sure none of these files have unstaged changes, and exit if they
# do
paths_with_unstaged_changes = []

for path in paths_to_add:
    has_unstaged_changes = (
        subprocess.run(["git", "diff", "--quiet", path]).returncode != 0
    )

    if has_unstaged_changes:
        paths_with_unstaged_changes.append(os.path.abspath(path))

if paths_with_unstaged_changes:
    print(
        "Aborting. There are unstaged changes in this repository"
        + " at the following path"
        + ("s" if len(paths_with_unstaged_changes) > 1 else "")
        + ":"
    )
    print(*paths_with_unstaged_changes, sep="\n")
    sys.exit(1)

# Run the script to generate the changes to push
subprocess.run(["sh", "./1_make_data_and_html_and_min_js.sh"], check=True)

# Add the changes with Git
for git_add_command in [["git", "add", path] for path in paths_to_add]:
    subprocess.run(git_add_command, check=True)

# Check again for staged changes, this time to determine if the script
# produced any changes. Exit if there are no changes.
made_any_changes = (
    subprocess.run(["git", "diff", "--cached", "--quiet"]).returncode != 0
)

if not made_any_changes:
    print("Aborting. No new changes to add.")
    sys.exit(0)

# Exit if we were told not to commit, otherwise, make a commit
if args.no_commit:
    sys.exit(0)

subprocess.run(["git", "commit", "-m", "Add new data"], check=True)

# Exit if we were told not to push, otherwise, continue with pushing
# logic
if args.no_push:
    sys.exit(0)

# Get the names for some Git things
local_branch_name = (
    subprocess.run(
        ["git", "rev-parse", "--abbrev-ref", "HEAD"], capture_output=True, check=True
    )
    .stdout.decode("utf-8")
    .strip()
)

remote_name, remote_branch_name = (
    subprocess.run(
        ["git", "rev-parse", "--symbolic-full-name", "--abbrev-ref", "@{u}"],
        capture_output=True,
        check=True,
    )
    .stdout.decode("utf-8")
    .strip()
    .split("/")
)

# Prompt to confirm pushing
if not args.yes and input(
    f"Pushing local branch {local_branch_name}"
    + f"to remote branch {remote_name}/{remote_branch_name}."
    + "Is this okay? [Y/n] "
).lower() in {"n", "no"}:
    sys.exit(0)

# Push the commit
subprocess.run(
    ["git", "push", remote_name, f"{local_branch_name}:{remote_branch_name}"],
    check=True,
)
