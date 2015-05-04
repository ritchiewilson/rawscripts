#!/bin/bash


#Get the root directory of the project
DIR="$( cd "$( dirname "$0" )" && pwd )"
cd $DIR
cd ..
ROOT=$(pwd)


#Closure Compiler
cd $ROOT"/scripts"
mkdir compiler && cd compiler
wget http://closure-compiler.googlecode.com/files/compiler-latest.zip
unzip *.zip
rm *.zip
