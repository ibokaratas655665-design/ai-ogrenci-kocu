@echo off
title AI Ogrenci Kocu - Gelistirici Modu Baslatici
color 0A
cls
echo ==========================================
echo     AI OGRENCI KOCU - BASLATIYORUZ
echo ==========================================
echo.
echo NOT: Bu dosya sadece GELISTIRICI MODU icindir.
echo Eger uygulamayi kurmak istiyorsaniz, lutfen olusturulan
echo ".exe" dosyasini kullanin.
echo.
echo 1. Gerekli dosyalar kontrol ediliyor...
echo (Bu islem internet hizina bagli olarak zaman alabilir)
call npm.cmd install
if %errorlevel% neq 0 (
    color 0C
    echo.
    echo [HATA] Kurulumda hata olustu! Lutfen internetinizi kontrol edin.
    pause
    exit /b
)

echo.
echo 2. Sunucu baslatiliyor...
echo - Tarayici birazdan otomatik acilacak.
echo - Acilmazsa su adrese gidin: http://localhost:5173
echo.

:: 3 saniye bekle sonra linki ac
timeout /t 3 /nobreak >nul
start http://localhost:5173

echo Uygulama calisiyor. Kapatmak icin bu pencereyi kapatin.
echo ------------------------------------------
call npm.cmd run dev
pause
