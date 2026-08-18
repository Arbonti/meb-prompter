@echo off
chcp 65001 > nul

REM ÖNEMLİ: Bat dosyasının bulunduğu klasöre geç
REM Bu olmadan "index.html" ve Python sunucusu yanlış klasörde çalışır
cd /d "%~dp0"

title MEB Aydin Il Istatistik Asistani
echo.
echo  ╔════════════════════════════════════════════╗
echo  ║   MEB Aydın İl İstatistik Asistanı        ║
echo  ║   Yapay Zeka Destekli Web Uygulaması       ║
echo  ╚════════════════════════════════════════════╝
echo.
echo  Klasor: %CD%
echo.

REM Python varsa HTTP sunucusu olarak başlat (haritalar icin gerekli)
where python >nul 2>&1
if %ERRORLEVEL% == 0 (
    echo  [OK] Python bulundu - HTTP sunucusu baslatiliyor...
    echo  [OK] Yerel Adres  : http://localhost:8080
    echo  [OK] Ag Adresiniz : Asagida ipconfig ile gorebilirsiniz
    echo.
    echo  Agdaki diger cihazlar icin IP adresinizi ogrenmek icin:
    echo  Yeni bir cmd acin ve "ipconfig" yazin - IPv4 Address satirini gorun
    echo  Ornek: http://192.168.1.100:8080
    echo.
    echo  [!!] Bu pencereyi KAPATMAYIN - kapatirsamiz uygulama durur.
    echo.
    REM 2 saniye bekle, sonra tarayiciyi ac (sunucu hazir olmadan açilmasin)
    ping -n 3 127.0.0.1 > nul
    start "" "http://localhost:8080"
    python -m http.server 8080 --bind 0.0.0.0
) else (
    echo  [!!] Python bulunamadi - dosya olarak aciliyor...
    echo  [!!] Not: Haritalar file:// modunda yuklenemeyebilir.
    echo  [!!] Python icin: https://python.org/downloads
    echo.
    start "" "%CD%\index.html"
    pause
)
