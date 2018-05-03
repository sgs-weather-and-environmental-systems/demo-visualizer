Installing and Running GUI Composer 2 Applications
==================================================
Copyright 2015-2017. Texas Instruments Incorporated. All rights reserved.

-----------------

Table of Contents
-----------------

This file contains the following sections:

* Installing the GUI Composer Runtime
* Windows Installation Instructions
* Mac (OSX) Installation Instructions
* Linux (64b) Installation Instructions
* Links to Additional Information

---------------------------------------

**Installing the GUI Composer Runtime**
---------------------------------------

In order to run a GUI Composer 2 Application, you must first install the GUI Composer 2 Runtime.
To install the runtime, please select File / Export / Standalone App from the GUI Composer 2 Designer's File menu,
click on the appropriate download link and run the downloaded installer.

To install a standalone project from a downloaded zip file, unzip the downloaded file and
copy the application folder that it contains into the GUI Composer Runtime root folder.
(The GUI Composer runtime folder is the one that contains a file named version.xml)

Further OS-specific instructions are provided below.

-------------------------------------

**Windows Installation Instructions**
-------------------------------------

If the GUI Composer application has been installed by an installation program, a shortcut to the application is
installed in the Windows Start menu under Texas Instruments.

You can alternatively start an application by running the win32_start.bat batch file that is located
in the application's project folder.  This is typically located in the guicomposer folder that is in your Users folder.
e.g:

	c:\Users\<myUserName>\guicomposer\runtime\gcruntime.v4\<project name>\win32_start.bat


---------------------------------------

**Mac (OSX) Installation Instructions**
---------------------------------------
To run your application:

  * if you are using a network proxy, ensure that your proxy settings under System Preferences/Network/Ethernet/Advanced/Proxies bypass both localhost and 127.0.0.1
  * open a terminal window
  * cd into the application folder (which is located in the guicomposer runtime folder)

The following commands may be required to be executed from the Terminal app with this folder as the working directory
in order to enable proper execution of the application:

    sudo chmod -R a+rwx ../..

Then run the application by entering the following command

    ./mac_start.sh


--------------------------------------------

**Linux (64 bit) Installation Instructions**
--------------------------------------------

To install all prerequisites for your application:

  * open a terminal window
  * cd into the application folder (which is located in the guicomposer runtime folder)

The following commands need to be executed from the Terminal app with this folder as the working directory in order
to enable proper execution of the application:

     sudo ln -sf /lib/x86_64-linux-gnu/libudev.so.1 /lib/x86_64-linux-gnu/libudev.so.0
     sudo apt-get install lib32stdc++6 libc6-i386 libusb-1.0-0-dev:i386
     sudo chmod -R a+rwx ../..
     cd linux/TICloudAgent
     sudo ./install.sh --install

To run your application, cd into the application folder and enter the following command:

     ./linux_start.sh


If the application needs to access to your PC's serial ports, you may need to configure permissions to access
the serial ports by adding yourself to the group that owns the /dev/usbPortName
To find out what group the serial port ttyACM0 is owned by, do

     ls -l /dev/ttyACM0

Assuming the group is named dialout, add yourself to that group by using the sudo adduser command:

     sudo adduser my_user_name dialout

You may also need to change the permissions on the USB port to permit read / write access for anyone.

     sudo chmod 666 /dev/ttyACM0

For more information, please see
http://askubuntu.com/questions/112568/how-do-i-allow-a-non-default-user-to-use-serial-device-ttyusb0

In order to get permission to use USB-HID ports, you will need to create a file in /etc/udev/rules.d named
usbhid.rules that contains the following:

    ATTRS(idVendor)=="2047", MODE="0666"

If your PC is configured to use a proxy, you will need to ensure that there is no proxy for localhost.  To do this,
edit your .bashrc file

     gedit ~/.bashrc

and add the following two lines:

     no_proxy=localhost,127.0.0.1,local.home
     export no_proxy

-------------------------------

Links to Additional Information
-------------------------------

Please visit http://dev.ti.com for more info about GUIComposer2

For help, please see https://dev.ti.com/gc/designer/help/Tutorials/GettingStarted/index.html


