@echo off
echo "Building main.js"
call browserify src\main.js -o build\main.js
echo "Done"