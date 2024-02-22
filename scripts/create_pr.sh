#!/bin/sh

set -e

cd $(git rev-parse --show-toplevel)

LATEST_TAG=$(git describe --tags --always --abbrev=0)
BRANCH_NAME="update-web-gui-to-$LATEST_TAG"
FOLDER="ros2_ros_bt_py"

gh repo clone fzi-forschungszentrum-informatik/ros2_ros_bt_py $FOLDER
cd $FOLDER

# Setup the committers identity.
git config user.email "hollie@fzi.de"
git config user.name "Hollie"

# Create a new feature branch for the changes.
git checkout -b $BRANCH_NAME

rm -r ros_bt_py_web_gui/html

# Update the script files to the latest version.
cp -R ../dist ros_bt_py_web_gui/html

# Commit the changes and push the feature branch to origin
git add .
git commit -m "Update Web-GUI to $LATEST_TAG"
git push origin $BRANCH_NAME

gh pr create \
  --body "See details: https://github.com/fzi-forschungszentrum-informatik/ros2_ros_bt_py_web_gui/tree/$LATEST_TAG" \
  --title "Update Web-GUI to $LATEST_TAG" \
  --head "$BRANCH_NAME" \
  --base "dev" \
  --assignee "@me" \
  --label "bot" \
  --label "enhancement" \
  --label "GUI"

cd ..
rm -rf $FOLDER
