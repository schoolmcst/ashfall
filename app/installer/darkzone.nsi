; DARKZONE installer for Windows (per-user, no admin needed). Built by app/dist.sh with the Linux makensis.
Unicode true
!include "MUI2.nsh"
!define APP "DARKZONE"
!ifndef VERSION
  !define VERSION "1.0.0"
!endif
Name "${APP}"
OutFile "${OUTFILE}"
InstallDir "$LOCALAPPDATA\Programs\${APP}"
RequestExecutionLevel user
SetCompressor /SOLID lzma
!define MUI_ICON "${BRAND}\darkzone.ico"
!define MUI_UNICON "${BRAND}\darkzone.ico"
!define MUI_ABORTWARNING
!define MUI_WELCOMEPAGE_TITLE "DARKZONE"
!define MUI_WELCOMEPAGE_TEXT "This installs DARKZONE, a first-person shooter you can play solo against bots or online with friends.$\r$\n$\r$\nThe game keeps itself up to date: every time you open it, it downloads the newest patch.$\r$\n$\r$\nClick Next to continue."
!define MUI_FINISHPAGE_RUN "$INSTDIR\DARKZONE.exe"
!define MUI_FINISHPAGE_RUN_TEXT "Play DARKZONE now"
!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_INSTFILES
!insertmacro MUI_PAGE_FINISH
!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES
!insertmacro MUI_LANGUAGE "English"
VIProductVersion "${VERSION}.0"
VIAddVersionKey "ProductName" "${APP}"
VIAddVersionKey "FileDescription" "${APP} Setup"
VIAddVersionKey "FileVersion" "${VERSION}"
VIAddVersionKey "CompanyName" "schoolmcst"
VIAddVersionKey "LegalCopyright" "schoolmcst"

Section "Install"
  nsExec::Exec 'taskkill /im DARKZONE.exe /f'
  SetOutPath "$INSTDIR"
  RMDir /r "$INSTDIR\resources"
  File /r "${SRC}\*.*"
  File "${BRAND}\darkzone.ico"
  CreateShortCut "$DESKTOP\${APP}.lnk" "$INSTDIR\DARKZONE.exe" "" "$INSTDIR\darkzone.ico" 0
  CreateShortCut "$SMPROGRAMS\${APP}.lnk" "$INSTDIR\DARKZONE.exe" "" "$INSTDIR\darkzone.ico" 0
  WriteUninstaller "$INSTDIR\Uninstall DARKZONE.exe"
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APP}" "DisplayName" "${APP}"
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APP}" "DisplayIcon" "$INSTDIR\darkzone.ico"
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APP}" "DisplayVersion" "${VERSION}"
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APP}" "Publisher" "schoolmcst"
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APP}" "InstallLocation" "$INSTDIR"
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APP}" "UninstallString" '"$INSTDIR\Uninstall DARKZONE.exe"'
  WriteRegDWORD HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APP}" "NoModify" 1
  WriteRegDWORD HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APP}" "NoRepair" 1
SectionEnd

Section "Uninstall"
  nsExec::Exec 'taskkill /im DARKZONE.exe /f'
  Delete "$DESKTOP\${APP}.lnk"
  Delete "$SMPROGRAMS\${APP}.lnk"
  RMDir /r "$INSTDIR"
  DeleteRegKey HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APP}"
SectionEnd
