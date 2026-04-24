# Fruit Classifier (Expo + React Native + NativeWind + TypeScript)

## 1) Start the Flask API

From `d:\test`:

```powershell
python app.py
```

Make sure your firewall allows inbound connections on port `5000`.

## 2) Start the mobile app (Expo Go / Android)

From `d:\test\mobile`:

```powershell
npm install
```

## 3) Connect the app to your API

### Real Android phone (Expo Go)

Your phone must reach your PC over LAN:

- Find your PC IP (example): `192.168.1.10`
- Use: `http://192.168.1.10:5000`

You can set the URL either:

A) In the app: edit the **API base URL** field.

B) When starting Expo:

```powershell
$env:EXPO_PUBLIC_API_URL="http://192.168.1.10:5000"
npx expo start --lan
```

Then open Expo Go on Android and scan the QR code.

### Android emulator

Use:

- `http://10.0.2.2:5000`

```powershell
$env:EXPO_PUBLIC_API_URL="http://10.0.2.2:5000"
npx expo start --lan
```

## 4) Use the app

- Tap **Scan** to open the camera and capture a fruit photo (or **Pick Image**)
- Tap **Predict**

Notes:
- The first time you tap **Scan**, Android will ask for camera permission.