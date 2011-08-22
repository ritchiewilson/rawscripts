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

# Closure library
cd $ROOT"/static"
svn checkout http://closure-library.googlecode.com/svn/trunk/ closure-library

#Gdata
cd $ROOT
wget http://gdata-python-client.googlecode.com/files/gdata-2.0.14.tar.gz
tar xvzf gdata-2.0.14.tar.gz
mv gdata-2.0.14/src/gdata gdata
mv gdata-2.0.14/src/atom atom
rm gdata-2.0.14.tar.gz
rm -rf gdata-2.0.14
