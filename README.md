# Akhilesh Mechanics Billing Application

This is a production-ready, offline-first React Native (Expo) billing application designed for **Akhilesh Mechanics**.

## Features

- **Offline First**: All bills and data are stored locally on the device. No internet required for core billing capabilities.
- **Smart AI Assistant**: Features a simple rule-based AI engine that operates offline to understand commands like _"Add clutch plate for 1200"_, _"change gear oil price to 400"_, or _"remove clutch plate"_.
- **Professional PDF Generation**: Instantly generates professional, printable, A4-ready invoices and lets you share them via WhatsApp or email.
- **Easily Editable**: Edit quantities, prices, and names on the fly right from the home screen.
- **Low-End Device Compatibility**: Works smoothly on Android 8+ using React Native's standard optimized UI components.

## How to use locally

To run the app locally on your machine or test on your phone:

1. Make sure you have Node JS installed.
2. In this folder, run \`npm install\` (if not already installed).
3. Run \`npx expo start\` to start the Metro bundler.
4. Download the **Expo Go** app on your Android device from the Play Store.
5. Scan the QR code shown in your terminal from the Expo Go app to preview it live.

## How to build an APK

To compile this project into a standalone Android APK:

1. Install EAS CLI: \`npm install -g eas-cli\`
2. Login to your Expo account: \`eas login\` (Create a free account at expo.dev if you don't have one)
3. Run the build command for Android: \`eas build -p android --profile preview\`
4. Wait for the build to finish in the cloud (takes about 5-10 minutes).
5. EAS will provide you with a direct link to download the **.apk** file! Download and install it on your Android phone.

> Note: Because building an APK directly on a Windows PC requires a heavy and complex Android SDK / Android Studio setup, using Expo EAS is the fastest, cleanest, and most foolproof way to generate your APK.
