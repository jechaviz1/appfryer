# AppFryer

This is an AppFryer project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   yarn install
   ```

2. Start the app

   ```bash
    yarn expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Compiles native app locally

### iOs
```bash
yarn expo run:ios
```

Using `eas` for create artifact
```bash
eas build -p ios --profile development --local
```
After that it'll create the file `build-xxxxxxxxxxxxx.ipa`.
Open `Xcode` -> `Window` -> `Devices and Simulators`
It will open the `Devices and Simulators` window. Select the `Devices` section and select the device from the left pane.
Drag and drop the app/IPA on to the `INSTALLED APPS` section.
Wait for Xcode to finish the installation.

### Android
```bash
yarn expo run:android
```

Also using `eas`:
```bash
eas build --platform android --profile production --local
eas build --platform android --profile preview --local
eas build --platform ios --profile ios-simulator --local
```

## Adding packages
**NB!** Please, if you try to add `expo-`-package, use `yarn expo install expo-...`. Otherwise you can give more strange errors.

After adding some new package (or updating existed) need to download/recompile pods for iOs:
```bash
cd ios/
pod install
cd ..
```

## Enabling mobile app notifications
Files:
- `google-services.json` - created after adding Android to [Firebase](https://console.firebase.google.com/) project. Can be downloaded from Project settings
- `<project-id>-<api-key>.json` - you can find it here:
    - Firebase project -> Project settings -> Cloud Messaging;
    - on section `Firebase Cloud Messaging API (V1)` click on `Manage Service Accounts`. It'll redirect you to [Service accounts](https://console.cloud.google.com/iam-admin/serviceaccounts/);
    - open `Actions` 
Copy `google-services.json` into `./android/app/` and `./secrets/`
You can copy `<project-id>-<api-key>.json` into `./secrets/`.

To add the API key to Expo:
```bash
eas credentials
```
Select:
    -> Platform - `Android`
    -> Profile - `development`
    -> What do you want to do - `Google Service Account`
    -> `Manage your Google Service Account Key for Push Notifications (FCM V1)`
    -> `Set up a Google Service Account Key...`
    -> select the right file with the key (`<project-id>-<api-key>.json`)
    -> ctrl+c

### Troubleshooting
The error message indicates that the build process is failing because it cannot copy the `google-services.json` file from the specified source to the destination in your React Native project's Android folder. This issue is common when using EAS Build (Expo Application Services) or when setting up Firebase in a React Native app.

Possible Causes & Solutions:
1. Ensure the `google-services.json` File Exists
Check if the `google-services.json` file is present in your project.
If not, download it again from Firebase:
Go to the Firebase Console.
Select your project.
Navigate to Project settings -> General.
Scroll down to Your apps, find the Android app, and download the google-services.json file.
Place it inside your project's `/android/app/` directory.

2. Verify Your EAS Build Secrets Configuration
If you are using EAS Build, ensure that the google-services.json file is uploaded correctly as a secret:

Run the following command to check if the file is properly added:
```sh
eas secret:list
```
If it's missing, add the file as a secret:
```sh
eas secret:create --name GOOGLE_SERVICES_JSON --value @google-services.json
```
In your eas.json file, confirm that your build process uses the secret correctly:
```json
{
  "build": {
    "production": {
      "env": {
        "GOOGLE_SERVICES_JSON": "@google-services.json"
      }
    }
  }
}
```

3. Manually Copy the google-services.json File
If the automatic copying process fails, try manually copying the file before running the build:
```sh
cp google-services.json android/app/google-services.json
```
4. Check .gitignore & .easignore
Sometimes, the google-services.json file is ignored by Git or EAS Build:

Open .gitignore and .easignore files and ensure that google-services.json is not excluded.
5. Re-run EAS Build with Clean Cache
Try running:
```sh
eas build --platform android --profile preview --clear-cache --local
```
This clears any cached files that may be causing issues.

To add push notifications for iOS you need:
- Open `/ios/appFryer.xcworkspace`
- On project page open tab `Signing & Capabilities`
- Click on `+ Capability` and add `Push Notification`
- After that rebuild the iOS project: `yarn run ios`

## Get a fresh project
When you're ready, run:

```bash
yarn run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.
