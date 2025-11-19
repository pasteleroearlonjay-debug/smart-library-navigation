# 🏫 Smart Library System

A modern library management system with ESP32 LED control for subject area illumination. When users search for books, the corresponding subject LED lights up on the ESP32 hardware.

## ✨ Features

- **📚 Book Search**: Search books by title, author, or subject
- **💡 LED Control**: 6 LEDs illuminate different subject areas
- **🌐 Real-time Updates**: Firebase Firestore for real-time data
- **📱 Modern UI**: Beautiful Next.js interface
- **🔧 Hardware Integration**: ESP32 microcontroller control
- **📊 Analytics**: Search logging and system monitoring

## 🎯 Subject to LED Mapping

| Subject | LED | GPIO Pin | Color |
|---------|-----|----------|-------|
| Mathematics | LED1 | GPIO 2 | 🔴 |
| Science | LED2 | GPIO 4 | 🔵 |
| Social Studies | LED3 | GPIO 5 | 🟡 |
| PEHM | LED4 | GPIO 18 | 🟢 |
| Values Education | LED5 | GPIO 19 | 🟣 |
| TLE | LED6 | GPIO 21 | 🟠 |

## 🚀 Quick Start

### Prerequisites

- Node.js (v18+)
- Firebase account
- ESP32 development board
- 6 LEDs + resistors

### 1. Clone Repository

```bash
git clone https://github.com/your-username/smart-library-system.git
cd smart-library-system
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Firebase Setup

1. Create Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Enable Firestore Database
3. Update `firebase-setup.js` with your Firebase config
4. Initialize database:

```bash
npm run setup-firebase
```

### 4. Environment Configuration

```bash
cp env.example .env.local
```

Update `.env.local` with your Firebase configuration.

### 5. Deploy to Vercel

```bash
npm run deploy
```

### 6. Configure ESP32

1. Update WiFi credentials in `esp32_led_control.ino`
2. Update API URL to your Vercel deployment
3. Upload to ESP32

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Next.js App   │    │   Firebase      │    │   ESP32         │
│   (Vercel)      │◄──►│   Firestore     │◄──►│   Hardware      │
│                 │    │                 │    │                 │
│ • Search UI     │    │ • Books Data    │    │ • 6 LEDs        │
│ • LED Control   │    │ • LED States    │    │ • WiFi Module   │
│ • API Endpoints │    │ • Search Logs   │    │ • GPIO Control  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 📁 Project Structure

```
smart-library-system/
├── app/                    # Next.js app directory
│   ├── api/led/control/   # LED control API
│   ├── search/page.tsx    # Search interface
│   └── page.tsx           # Main dashboard
├── components/            # React components
├── lib/                   # Utilities
│   └── firebase.ts       # Firebase configuration
├── backend/              # PHP backend (optional)
├── esp32_led_control.ino # ESP32 Arduino code
├── firebase-setup.js     # Database initialization
├── vercel.json           # Vercel configuration
└── DEPLOYMENT_GUIDE.md   # Deployment instructions
```

## 🔧 Configuration

### Firebase Collections

- **books**: Book information and availability
- **led_states**: Current LED states for ESP32
- **search_logs**: Search activity tracking
- **users**: User management (optional)

### Environment Variables

```env
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_API_KEY=your-api-key
FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
FIREBASE_STORAGE_BUCKET=your-project.appspot.com
FIREBASE_MESSAGING_SENDER_ID=your-sender-id
FIREBASE_APP_ID=your-app-id
```

## 🧪 Testing

### Website Testing
1. Visit your Vercel deployment
2. Search for "Algebra" (Mathematics subject)
3. Click "Light Up" button
4. Verify Mathematics LED illuminates

### ESP32 Testing
1. Check Serial Monitor for WiFi connection
2. Verify LED test sequence on startup
3. Monitor API polling messages

### Firebase Testing
1. Check Firebase Console for data
2. Verify search logs are created
3. Monitor LED state updates

## 🔒 Security

- Firebase security rules for data protection
- Environment variables for sensitive data
- HTTPS for all API communications
- Input validation and sanitization

## 📊 Monitoring

- Vercel Analytics for performance
- Firebase Console for database usage
- ESP32 Serial Monitor for hardware status
- Search activity logging

## 🚨 Troubleshooting

### Common Issues

1. **Build Failures**: Check environment variables
2. **ESP32 Connection**: Verify WiFi and API URL
3. **LED Not Working**: Check wiring and GPIO pins
4. **Firebase Errors**: Verify project configuration

### Debug Steps

1. Check Vercel deployment logs
2. Monitor ESP32 Serial output
3. Verify Firebase Console data
4. Test API endpoints manually

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Make changes
4. Test thoroughly
5. Submit pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Firebase for backend services
- Vercel for hosting
- Next.js for the framework
- ESP32 community for hardware support

## 📞 Support

For support and questions:
- Check the [Deployment Guide](DEPLOYMENT_GUIDE.md)
- Review troubleshooting section
- Open an issue on GitHub

---

**Built with ❤️ for smart libraries everywhere!**