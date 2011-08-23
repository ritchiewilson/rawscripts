.. _working-on-code:

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

Download the code from https://gitorious.org/rawscripts/rawscripts

--OR--

Use git::

    git clone git://gitorious.org/rawscripts/rawscripts.git


Get the Libraries Used
----------------------

The sofware needs the closure libraray, the closure compiler, and a
handfull of others.

For ease of use, There is a script that will grab all these and put
them in the right places.::

    sh /path/to/project/root/scripts/dependencies.sh

Voila.

Download AppEngine SDK
----------------------

For the moment it runs on AppEngine, so get the SDK `here 
<http://code.google.com/appengine/downloads.html#Google_App_Engine_SDK_for_Python>`_.

It is set up for Python 2.5, but also works well on 2.6. If your
default is 2.7 or higher, you'll need to change it.

Set up Config.py
================

There is a sample config.py.sample, and you should be able to copy
that to config.py. The settings in that file should be obvious. Except
for maybe "DEV" or "PRO" modes.

"DEV" versus "PRO" Mode
=======================

In config.py, the distinction between "DEV" and "PRO" mode has to do
with the Closure Libraray. The library is a collection of files, not
one big file like jQuery. When config.py sets the mode to
"DEV"(default), each time you visit a page, the page will make http
calls for the scores of JS and CSS files needed from the library. All
those calls goes quickly over localhost, and this is the best way to
do development.

When it is deployed for actual use, though, it is a terrible idea to
make all those calls for resources. So what you do is compile all the
resources into one big JS files and one big CSS file. There is are
scripts to help you do this.::

    sh scripts/compile-js.sh [ editor | scriptlist | titlepage ]
    ./scripts/cssmin [ editor | scriptlist ]

These take all the static resources and compile them into one big JS
file and one big CSS file. Only 'editor', 'scriptlist', and
'titlepage' pages need the JS compiled. Only 'editor' and 'scriptlist'
need the CSS combined.

Then, in config.py, you can change the mode to "PRO". When each page
loads it won't load scores of tiny files but just a couple of large
ones.

Running Locally
===============

Assuming you have downloaded everything mentioned above and set up
config.py, you are all set to run it locally.

Mac
---

The AppEngine SDK for Mac is a nice enough GUI. Start a new project,
select the project directory, click "Run". 


Linux
-----
Unzip the downloaded SDK.

Then in the terminal run:::

    python /path/to/google_appengine/dev_appserver.py path/to/project/root

Windows
-------

I don't have a Windows machine.

Running this on Windows should be easy, though. If you get it going,
add what you've learned to the docs. If you have any questions, lemme
know.

Open in Browser
---------------

It should now be running on localhost on whatever port you
assigned. The default is http://localhost:8080

.. _deployment:

Deployment
==========

The plan is to rerwite the backend so that Rawscripts no long runs on
AppEngine, but instead will run on any other server with a LAMP-ish
stack. That day will be great, and this day kinda sucky, so I wouldn't
recommend running your own instance at this time.

However, you're going to do it anyways, so I can give you a quick
rundown of the process.

#. You need a 'Google Account <http://google.com/accounts>`_.
#. Start an AppEngine project at http://appengine.google.com. 
#. The only default to change is the "Authentication Options." This should be changed to OpenId.
#. Whatever you name your project should be put into the app.yaml file. So, if your project is at example.appspot.com, change the first line of app.yaml to ::

    application: example

#. Use the downloaded AppEngine SDK to upload the project. On the Mac this is a simple GUI. On Linux, use the appcfg.py file. All the commands for that can be found `online <http://code.google.com/appengine/docs/python/tools/uploadinganapp.html>`_.
