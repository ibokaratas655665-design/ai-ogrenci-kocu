@echo off
set "JAVA_HOME=C:\Program Files\Android\Android Studio\jbr"
set "ANDROID_SDK_ROOT=C:\Users\İBRAHİM\AppData\Local\Android\Sdk"
echo Building APK...
call gradlew.bat assembleDebug
if %ERRORLEVEL% EQU 0 (
    echo BUILD SUCCESSFUL
) else (
    echo BUILD FAILED
    exit /b %ERRORLEVEL%
)
