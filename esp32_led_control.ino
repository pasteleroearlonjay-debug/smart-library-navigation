#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

// WiFi credentials - UPDATE THESE
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";

// API endpoint - UPDATE THIS TO YOUR VERCEL URL
const char* apiUrl = "https://v0-smart-library-system-theta.vercel.app/api/led/control";

// LED pin definitions for 6 subjects
const int ledPins[6] = {2, 4, 5, 18, 19, 21}; // GPIO pins for LEDs 1-6

// Subject names for debugging
const char* subjectNames[6] = {
  "Mathematics",
  "Science", 
  "Social Studies",
  "PEHM",
  "Values Education",
  "TLE"
};

// LED states
bool ledStates[6] = {false, false, false, false, false, false};

// Timing variables
unsigned long lastCheck = 0;
const unsigned long checkInterval = 2000; // Check every 2 seconds

void setup() {
  Serial.begin(115200);
  
  // Initialize LED pins
  for (int i = 0; i < 6; i++) {
    pinMode(ledPins[i], OUTPUT);
    digitalWrite(ledPins[i], LOW); // Start with all LEDs off
  }
  
  Serial.println("Smart Library LED System Starting...");
  
  // Connect to WiFi
  WiFi.begin(ssid, password);
  Serial.print("Connecting to WiFi");
  
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  
  Serial.println();
  Serial.println("WiFi connected!");
  Serial.print("IP address: ");
  Serial.println(WiFi.localIP());
  
  // Test all LEDs briefly
  testAllLEDs();
}

void loop() {
  // Check if it's time to poll the API
  if (millis() - lastCheck >= checkInterval) {
    checkLEDStatus();
    lastCheck = millis();
  }
  
  // Check WiFi connection and reconnect if needed
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi connection lost. Reconnecting...");
    WiFi.reconnect();
    delay(5000);
  }
}

void checkLEDStatus() {
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    
    // Create URL for getting all LED states
    String url = String(apiUrl);
    
    http.begin(url);
    http.addHeader("Content-Type", "application/json");
    
    int httpResponseCode = http.GET();
    
    if (httpResponseCode > 0) {
      String response = http.getString();
      Serial.println("HTTP Response code: " + String(httpResponseCode));
      Serial.println("Response: " + response);
      
      // Parse JSON response
      DynamicJsonDocument doc(1024);
      DeserializationError error = deserializeJson(doc, response);
      
      if (!error) {
        // Update LED states based on API response
        for (int i = 0; i < 6; i++) {
          int ledPin = i + 1; // LED pins are 1-6
          
          if (doc.containsKey(String(ledPin))) {
            JsonObject ledData = doc[String(ledPin)];
            String state = ledData["state"].as<String>();
            String subject = ledData["subject"].as<String>();
            
            bool newState = (state == "on");
            
            // Only update if state has changed
            if (ledStates[i] != newState) {
              ledStates[i] = newState;
              digitalWrite(ledPins[i], newState ? HIGH : LOW);
              
              Serial.print("LED ");
              Serial.print(ledPin);
              Serial.print(" (");
              Serial.print(subjectNames[i]);
              Serial.print("): ");
              Serial.println(newState ? "ON" : "OFF");
            }
          }
        }
      } else {
        Serial.print("JSON parsing failed: ");
        Serial.println(error.c_str());
      }
    } else {
      Serial.print("HTTP GET failed, error: ");
      Serial.println(http.errorToString(httpResponseCode));
    }
    
    http.end();
  } else {
    Serial.println("WiFi not connected");
  }
}

void testAllLEDs() {
  Serial.println("Testing all LEDs...");
  
  // Turn on all LEDs
  for (int i = 0; i < 6; i++) {
    digitalWrite(ledPins[i], HIGH);
    Serial.print("LED ");
    Serial.print(i + 1);
    Serial.print(" (");
    Serial.print(subjectNames[i]);
    Serial.println(") ON");
    delay(500);
  }
  
  delay(1000);
  
  // Turn off all LEDs
  for (int i = 0; i < 6; i++) {
    digitalWrite(ledPins[i], LOW);
    Serial.print("LED ");
    Serial.print(i + 1);
    Serial.print(" (");
    Serial.print(subjectNames[i]);
    Serial.println(") OFF");
    delay(500);
  }
  
  Serial.println("LED test complete!");
}

// Function to manually control a specific LED (for testing)
void controlLED(int ledIndex, bool state) {
  if (ledIndex >= 0 && ledIndex < 6) {
    digitalWrite(ledPins[ledIndex], state ? HIGH : LOW);
    ledStates[ledIndex] = state;
    
    Serial.print("Manual control: LED ");
    Serial.print(ledIndex + 1);
    Serial.print(" (");
    Serial.print(subjectNames[ledIndex]);
    Serial.print(") ");
    Serial.println(state ? "ON" : "OFF");
  }
}
