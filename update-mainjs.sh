#!/usr/bin/env bash

# run with ./update-mainjs.sh <PATH_TO_OBISIDIAN_VAULT>
LIST=(
	"$1/.obsidian/plugins/github-gitless-sync/main.js"
	"../tuition-config/laptop/.obsidian/plugins/github-gitless-sync/main.js"
)

for DEST in "${LIST[@]}"; do
	echo "copying main.js to $DEST"
	cp main.js "$DEST"
done
