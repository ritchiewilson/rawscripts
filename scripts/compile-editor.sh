#!/bin/bash

cd ..
ROOT=$(cd `dirname $0` && pwd)

# Remove old compiled file if exists
rm $ROOT"/static/js/min/editor-compiled.js"

cd $ROOT"/static/closure-library/closure/bin"

I_FILE=$ROOT"/static/js/restricted/editor.js"
O_FILE=$ROOT"/static/js/min/editor-compiled.js"
CL_ROOT=$ROOT"/static/closure-library/"
JAR=$ROOT"/scripts/compiler/compiler.jar"

python calcdeps.py -i $I_FILE -p $CL_ROOT -o compiled > $O_FILE -c $JAR -f '--compilation_level=ADVANCED_OPTIMIZATIONS'
