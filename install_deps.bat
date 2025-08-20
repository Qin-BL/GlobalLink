@echo off
echo Installing backend dependencies...
cd "d:\项目\GlobalLink\backend"
echo Current directory: %CD%

echo Activating virtual environment...
call venv\Scripts\activate.bat

echo Installing dependencies...
"d:\项目\GlobalLink\backend\venv\Scripts\pip.exe" install -r requirements.txt

echo Installation complete!
pause