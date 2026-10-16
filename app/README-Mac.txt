ASHFALL for Mac
===============

There are two versions: "AppleSilicon" for Macs with an M1/M2/M3/M4 chip, "Intel" for older Macs.
(Apple menu > About This Mac shows which chip you have.)

1. Drag ASHFALL.app into your Applications folder.
2. Open Terminal (Applications > Utilities > Terminal), paste this line and press Return:

   plutil -replace NSMicrophoneUsageDescription -string "Voice chat" /Applications/ASHFALL.app/Contents/Info.plist; xattr -cr /Applications/ASHFALL.app && codesign --force --deep -s - /Applications/ASHFALL.app

   You only do this once. It is needed because the game is not signed with a paid Apple
   developer certificate; without it macOS says the app "is damaged" or "can't be opened".
3. Double-click ASHFALL in Applications. If macOS still asks, right-click it and choose Open.

Updates download by themselves when you open the game.
Voice chat: the first time you turn it on (pause menu > VOICE CHAT), macOS asks to use the microphone - click OK.
Already had the game before voice chat? Run the line in step 2 again once, then reopen the game.
Online: pick ONLINE TEAM DEATHMATCH or ONLINE FREE-FOR-ALL, then QUICK PLAY,
or type a private code that your friends type too.
