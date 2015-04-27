#!/bin/bash

last_commit=$(git rev-parse --verify HEAD | cut -c1-7)

zip -r rutorrent_add-0.0.15-$last_commit-fx.xpi content defaults locale modules skin chrome.manifest install.rdf
