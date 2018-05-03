REM start %~dp0\\..\\..\\win32\\node-webkit\\nw.exe %~dp0
set NW_EXE=..\\win32\\node-webkit\\nw.exe
set CHROMEDRV=..\\win32\\node-webkit\\chromedriver.exe
set CHROMEDRV_UP1=..\\..\\win32\\node-webkit\\chromedriver.exe

if exist %NW_EXE% (

    start %NW_EXE% --remote-debugging-port=9222 splash
) else (

    start ..\\%NW_EXE% --remote-debugging-port=9222 splash
)
