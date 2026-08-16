@echo off
echo ========================================
echo Firebase Deployment Script
echo ========================================
echo.

echo [1/3] Firebase Login kontrol ediliyor...
firebase login:list
if errorlevel 1 (
    echo.
    echo Firebase'e giris yapilmamis. Simdi giris yapilacak...
    echo Tarayici acilacak, Google hesabinizla giris yapin.
    firebase login
)

echo.
echo [2/3] Firebase projesi kontrol ediliyor...
firebase projects:list

echo.
echo [3/3] Firebase Hosting'e deploy ediliyor...
firebase deploy --only hosting

echo.
echo ========================================
echo Firebase Deployment Tamamlandi!
echo ========================================
echo.
echo Canlı URL'iniz:
echo https://ai-ogrenci-kocu-b037b.web.app
echo https://ai-ogrenci-kocu-b037b.firebaseapp.com
echo.
pause
