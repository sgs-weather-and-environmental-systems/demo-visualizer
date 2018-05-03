#!/bin/bash
CDDIR=`dirname "$BASH_SOURCE"`
NWDIR="$CDDIR/../mac/node-webkit"
echo  "CDDIR is '$CDDIR'"
echo  "NWDIR is '$NWDIR'"
{
if [ ! -e $NWDIR ]; then
    NWDIR="$CDDIR/../../mac/node-webkit"
    echo  "NWDIR(2) is '$NWDIR'"
fi
}

#Please hit Cmd Alt i when in GUI Composer to open the debugger.
$NWDIR/nwjs.app/Contents/MacOS/nwjs $CDDIR/splash
