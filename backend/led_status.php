<?php
require_once 'config.php';

setCORSHeaders();

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    sendErrorResponse('Method not allowed', 405);
}

try {
    $firestore = getFirestoreClient();
    
    if (!$firestore) {
        sendErrorResponse('Firebase connection failed', 500);
    }
    
    // Get the current LED states from Firebase
    $ledStatesCollection = $firestore->collection('led_states');
    $documents = $ledStatesCollection->documents();
    
    // Format the response for the ESP32
    $response = [];
    
    // Initialize all 6 LEDs with default state
    for ($pin = 1; $pin <= 6; $pin++) {
        $response[$pin] = [
            'state' => 'off',
            'subject' => '',
            'timestamp' => null
        ];
    }
    
    // Update with actual states from Firebase
    foreach ($documents as $document) {
        $ledData = $document->data();
        $pin = (int)$ledData['led_pin'];
        
        if ($pin >= 1 && $pin <= 6) {
            $response[$pin] = [
                'state' => $ledData['state'],
                'subject' => $ledData['subject'],
                'timestamp' => $ledData['last_updated']
            ];
        }
    }
    
    // Check if ESP32 is requesting a specific LED
    if (isset($_GET['ledPin'])) {
        $requestedPin = (int)$_GET['ledPin'];
        if ($requestedPin >= 1 && $requestedPin <= 6) {
            $specificLed = $response[$requestedPin];
            
            // Clear the state after sending (for one-time commands)
            if ($specificLed['state'] === 'on') {
                clearLEDState($requestedPin);
            }
            
            sendJSONResponse($specificLed);
        } else {
            sendErrorResponse('Invalid LED pin number');
        }
    }
    
    // Return all LED states
    sendJSONResponse($response);
    
} catch (Exception $e) {
    error_log("General error: " . $e->getMessage());
    sendErrorResponse('An error occurred', 500);
}

/**
 * Clear LED state after it has been processed by ESP32
 */
function clearLEDState($ledPin) {
    try {
        $firestore = getFirestoreClient();
        if (!$firestore) {
            return false;
        }
        
        // Find the document with the specified LED pin
        $ledStatesCollection = $firestore->collection('led_states');
        $query = $ledStatesCollection->where('led_pin', '=', $ledPin);
        $documents = $query->documents();
        
        foreach ($documents as $document) {
            $document->reference()->update([
                ['path' => 'state', 'value' => 'off'],
                ['path' => 'last_updated', 'value' => date('Y-m-d H:i:s')]
            ]);
            break; // Should only be one document per LED pin
        }
        
        error_log("Cleared LED state for pin: $ledPin");
        return true;
    } catch (Exception $e) {
        error_log("Failed to clear LED state: " . $e->getMessage());
        return false;
    }
}

/**
 * Update LED state in Firebase
 */
function updateLEDState($ledPin, $subject, $state) {
    try {
        $firestore = getFirestoreClient();
        if (!$firestore) {
            return false;
        }
        
        $ledStatesCollection = $firestore->collection('led_states');
        
        // Check if document exists for this LED pin
        $query = $ledStatesCollection->where('led_pin', '=', $ledPin);
        $documents = $query->documents();
        
        $ledData = [
            'led_pin' => $ledPin,
            'subject' => $subject,
            'state' => $state,
            'last_updated' => date('Y-m-d H:i:s')
        ];
        
        $documentExists = false;
        foreach ($documents as $document) {
            $document->reference()->set($ledData);
            $documentExists = true;
            break;
        }
        
        // If document doesn't exist, create it
        if (!$documentExists) {
            $ledStatesCollection->add($ledData);
        }
        
        error_log("Updated LED state: Pin $ledPin, Subject: $subject, State: $state");
        return true;
    } catch (Exception $e) {
        error_log("Failed to update LED state: " . $e->getMessage());
        return false;
    }
}
?>
