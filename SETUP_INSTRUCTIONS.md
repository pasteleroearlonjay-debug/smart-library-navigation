# Smart Library System - ESP32 LED Control Setup (Firebase)

This system uses an ESP32 microcontroller with 6 LEDs to illuminate different subject areas in a library when users search for books. The backend uses Firebase Firestore for data storage.

## System Overview

The system consists of:
- **ESP32** with 6 LEDs (one for each subject area)
- **Next.js Website** (hosted on Vercel) for the user interface
- **PHP Backend** with Firebase Firestore for book management
- **LED Mapping**: Each subject maps to a specific LED pin

### Subject to LED Mapping:
1. **Mathematics** → LED1 (GPIO 2)
2. **Science** → LED2 (GPIO 4) 
3. **Social Studies** → LED3 (GPIO 5)
4. **PEHM** → LED4 (GPIO 18)
5. **Values Education** → LED5 (GPIO 19)
6. **TLE** → LED6 (GPIO 21)

## Hardware Setup

### Required Components:
- ESP32 Development Board
- 6 LEDs (any color)
- 6 Resistors (220Ω or 330Ω)
- Breadboard
- Jumper wires
- USB cable for ESP32

### Wiring Diagram:
```
ESP32 GPIO 2  → Resistor → LED1 (Mathematics)
ESP32 GPIO 4  → Resistor → LED2 (Science)
ESP32 GPIO 5  → Resistor → LED3 (Social Studies)
ESP32 GPIO 18 → Resistor → LED4 (PEHM)
ESP32 GPIO 19 → Resistor → LED5 (Values Education)
ESP32 GPIO 21 → Resistor → LED6 (TLE)
ESP32 GND     → All LED cathodes
```

### Connection Steps:
1. Connect each GPIO pin to a resistor
2. Connect the other end of each resistor to the LED anode (longer leg)
3. Connect all LED cathodes (shorter leg) to ESP32 GND
4. Power the ESP32 via USB

## Software Setup

### 1. Firebase Setup

1. **Create Firebase Project**:
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Click "Create a project"
   - Enter project name (e.g., "smart-library-system")
   - Enable Google Analytics (optional)
   - Click "Create project"

2. **Enable Firestore Database**:
   - In Firebase Console, go to "Firestore Database"
   - Click "Create database"
   - Choose "Start in test mode" (for development)
   - Select a location close to your users
   - Click "Done"

3. **Get Firebase Configuration**:
   - Go to Project Settings (gear icon)
   - Scroll down to "Your apps"
   - Click "Add app" → Web app
   - Register app and copy the config object

4. **Update Configuration Files**:
   - Update `backend/config.php` with your Firebase project ID
   - Update `firebase-setup.js` with your Firebase config

### 2. Firebase Database Initialization

1. **Install Node.js dependencies**:
   ```bash
   npm install
   ```

2. **Update Firebase config in setup script**:
   - Edit `firebase-setup.js`
   - Replace the `firebaseConfig` object with your actual Firebase config

3. **Run the setup script**:
   ```bash
   npm run setup
   ```

4. **Verify data in Firebase Console**:
   - Go to Firestore Database
   - Check that collections `books`, `led_states`, and `users` are created
   - Verify sample data is present

### 3. PHP Backend Setup

1. **Install PHP dependencies**:
   ```bash
   composer install
   ```

2. **Configure Firebase Connection**:
   - Edit `backend/config.php`
   - Update `FIREBASE_PROJECT_ID` with your project ID
   - Optionally add service account key file for production

3. **Test PHP Endpoints**:
   ```bash
   # Test search endpoint
   curl -X POST http://localhost/backend/search.php \
     -H "Content-Type: application/json" \
     -d '{"query": "algebra"}'
   
   # Test LED status endpoint
   curl http://localhost/backend/led_status.php
   ```

### 4. ESP32 Arduino Code Setup

1. **Install Arduino IDE** and ESP32 board support
2. **Install Required Libraries**:
   - WiFi (built-in)
   - HTTPClient (built-in)
   - ArduinoJson (install via Library Manager)

3. **Configure the ESP32 Code**:
   - Open `esp32_led_control.ino`
   - Update WiFi credentials:
     ```cpp
     const char* ssid = "YOUR_WIFI_SSID";
     const char* password = "YOUR_WIFI_PASSWORD";
     ```
   - Update API URL to your Vercel deployment:
     ```cpp
     const char* apiUrl = "https://your-vercel-app.vercel.app/api/led/control";
     ```

4. **Upload Code to ESP32**:
   - Select ESP32 board in Arduino IDE
   - Upload the code
   - Open Serial Monitor (115200 baud) to see debug output

### 5. Next.js Website Setup

The website is already configured and deployed on Vercel. The key files are:

- **Main Page**: `app/page.tsx` - Dashboard with search interface
- **Search Page**: `app/search/page.tsx` - Book search with LED visualization
- **LED API**: `app/api/led/control/route.ts` - Controls ESP32 LEDs

## Testing the System

### 1. ESP32 Testing
1. Power on the ESP32
2. Check Serial Monitor for:
   - WiFi connection status
   - LED test sequence
   - API polling messages

### 2. Website Testing
1. Visit your Vercel deployment
2. Search for a book (e.g., "Algebra")
3. Click "Light Up" button
4. Verify the corresponding LED illuminates on the ESP32

### 3. Firebase Testing
1. Check Firebase Console for:
   - Search logs in `search_logs` collection
   - LED state updates in `led_states` collection
   - Book data in `books` collection

## Troubleshooting

### Firebase Issues:
- **Connection Failed**: Check project ID in config.php
- **Authentication Error**: Verify service account key file
- **Permission Denied**: Check Firestore security rules

### ESP32 Issues:
- **WiFi Connection**: Check SSID/password in code
- **LEDs Not Working**: Verify wiring and GPIO pins
- **API Errors**: Check Serial Monitor for HTTP response codes

### Website Issues:
- **Search Not Working**: Check browser console for errors
- **LED Not Lighting**: Verify API endpoint URL in ESP32 code

## API Endpoints

### Next.js API (Vercel):
- `POST /api/led/control` - Control LED states
- `GET /api/led/control` - Get current LED states

### PHP Backend:
- `POST /backend/search.php` - Search books and trigger LEDs
- `GET /backend/led_status.php` - Get LED status for ESP32

## Firebase Collections

### Books Collection:
```json
{
  "title": "Algebra Fundamentals",
  "author": "John Smith",
  "subject": "Mathematics",
  "isbn": "978-0-123456-01-1",
  "available": true,
  "created_at": "2024-01-16T10:00:00Z"
}
```

### LED States Collection:
```json
{
  "led_pin": 1,
  "subject": "Mathematics",
  "state": "off",
  "last_updated": "2024-01-16T10:00:00Z"
}
```

### Search Logs Collection:
```json
{
  "search_query": "algebra",
  "results_count": 1,
  "subjects_found": ["Mathematics"],
  "created_at": "2024-01-16T10:00:00Z"
}
```

## File Structure

```
smart-library-system-i8/
├── app/                          # Next.js app directory
│   ├── api/led/control/         # LED control API
│   ├── search/page.tsx          # Search interface
│   └── page.tsx                 # Main dashboard
├── components/                   # React components
├── backend/                      # PHP backend files
│   ├── config.php               # Firebase configuration
│   ├── search.php               # Search API
│   └── led_status.php           # LED status API
├── esp32_led_control.ino        # ESP32 Arduino code
├── firebase-setup.js            # Firebase initialization script
├── composer.json                # PHP dependencies
├── package.json                 # Node.js dependencies
└── SETUP_INSTRUCTIONS.md        # This file
```

## Security Considerations

1. **Firebase Security Rules**: Configure Firestore security rules for production
2. **API Security**: Consider adding authentication for production use
3. **WiFi Security**: Use WPA2/WPA3 encryption
4. **Physical Security**: Secure ESP32 and wiring

## Production Deployment

1. **Firebase Security**: Set up proper Firestore security rules
2. **Service Account**: Use service account key for PHP backend
3. **Environment Variables**: Store sensitive data in environment variables
4. **Monitoring**: Add logging and monitoring for system health

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review Serial Monitor output for ESP32
3. Check browser console for website errors
4. Verify Firebase Console for data and logs

## License

This project is open source and available under the MIT License.
