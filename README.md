# My Wallet 🌸

A soft, cute expense tracker that works like a real wallet. Money you spend is taken from the balance and sorted by category. Money you receive is added with a note about where it came from. Built with React Native and Expo.



## Features

- **Wallet balance** that updates as you add and take money
- **Add / Take** sheet with amount, category, and note
- **Categories:** clothes 👗, skincare 🧴, makeup 💄, food 🍓, other 🎀
- **Latest transactions** with notes and the date and time of each one, plus a "show more" option
- **Edit or delete** any transaction by tapping it
- **Overview** that tells you where you spend the most and your average spending per month
- **Works offline.** Everything is saved on your device
- Soft, clay-style 3D look in pink and lavender

## Tech

- React Native with [Expo](https://expo.dev)
- `@react-native-async-storage/async-storage` for saving data on the device
- No backend and no accounts

## Run it

You need [Node.js](https://nodejs.org) (LTS).

```bash
git clone https://github.com/YOUR-USERNAME/wallet.git
cd wallet
npm install
npx expo start
```

Then either scan the QR code with the **Expo Go** app on your phone (same Wi-Fi as your computer), or press `a` to open it in an Android emulator from Android Studio.

## Build an APK

Builds run in Expo's cloud, so nothing heavy is needed on your computer.

```bash
npm install -g eas-cli
eas login
eas build:configure
eas build -p android --profile preview
```

Make sure `eas.json` has this profile so the build produces an installable APK:

```json
{
  "build": {
    "preview": {
      "android": { "buildType": "apk" }
    }
  }
}
```

When the build finishes, open the download link on your phone and install it.

## Customize

Everything lives in `App.js`.

| What | Where |
| --- | --- |
| Your name in the greeting | `NAME` at the top |
| Currency | `CURRENCY` at the top |
| Categories and emoji | the `CATS` array |
| Colors, roundness, shadows | the `StyleSheet.create` block at the bottom |

## How it works

- Every transaction is an object: `{ id, type, amount, cat, note, date }`.
- The balance and the overview are **derived** from the list of transactions, never stored, so they always stay correct.
- Data is saved to AsyncStorage whenever the list changes and loaded when the app starts.
- One sheet handles adding, taking, and editing. The `editingId` state decides which one it is doing.

## Ideas for later

- Monthly filter and a monthly history view
- Charts per category
- AI-written spending summary
- Export to CSV
- Custom categories

## License

Personal project. 
