#!/bin/bash
CDDIR=`dirname "$BASH_SOURCE"`
NWDIR="$CDDIR/../linux/node-webkit"
echo  "CDDIR is '$CDDIR'"
echo  "NWDIR is '$NWDIR'"
{
if [ ! -e $NWDIR ]; then
    NWDIR="$CDDIR/../../linux/node-webkit"
    echo  "NWDIR(2) is '$NWDIR'"
fi
}
# Please hit F12 when in GUI Composer to open the debugger.
$NWDIR/nw $CDDIR/splash
