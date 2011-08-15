==========================
 Working On Code
==========================

.. contents:: Sections
   :local:

These instructions are for Mac and Linux users. We welcome Windows
users, but I havn't the foggiest which of this applies to you.

Download Everything
===================

Get the Code
------------

Download the code from gitorious

--OR--

do 
    git clone https://gitorious.org/rawscripts/rawscripts

Get the Libraries Used
----------------------

The sofware needs the closure libraray, the closure compiler, js-min
(for css compiling) and a handfull of others.

For ease of use, There is a script that will grab all these and put
them in the right places.

    sh /path/to/files/scripts/dependencies.sh

Voila.

Download AppEngine SDK
----------------------

For the moment it runs on AppEngine, so get the SDK at
http://code.google.com/appengine/downloads.html#Google_App_Engine_SDK_for_Python

Remember: Python!

Set up Config.py
================

There is a sample config.py.sample, and you should be able to copy
that to config.py. The settings in that file should be obvious.

There is a distinction, though, between "DEV" and "PRO" mode. The
Closure libraray is a collection of files, not one big file like
jQuery. In development mode, the localhost will simply server the
scores of files you need for each page. 

This is horrible for actual use, though, thus production mode. First
you need to compile the JS. This can be done with a script:

    sh scripts/compile-js.sh [page]

Page is whichever js need be compiled, i.e. "editor", "scriptlist",
"titlepage".

Running Locally
===============

Mac
---

The AppEngine SDK for Mac is a nice enough GUI. Start a new project,
select the project directory, click "Run". 


Linux
-----
Unzip the downloaded SDK

In the terminal run:

    python /path/to/google_appengine/dev_appserver.py
    path/to/project/root

Open in Browser
---------------

It should now be running on localhost on whatever port you
assigned. The default is http://localhost:8080
