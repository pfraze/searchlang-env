#!/bin/sh

echo "Building main.js"
browserify src/main.js -o build/main.js
echo "Done"