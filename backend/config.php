<?php
// Firebase configuration
require_once __DIR__ . '/../vendor/autoload.php';

use Google\Cloud\Firestore\FirestoreClient;

// Firebase project configuration
define('FIREBASE_PROJECT_ID', 'your-firebase-project-id');
define('FIREBASE_KEY_FILE', __DIR__ . '/../firebase-key.json'); // Optional: for service account

// API configuration
define('API_BASE_URL', 'https://v0-smart-library-system-theta.vercel.app');

// LED pin mapping
define('LED_PINS', [
    'Mathematics' => 1,
    'Science' => 2,
    'Social Studies' => 3,
    'PEHM' => 4,
    'Values Education' => 5,
    'TLE' => 6
]);

// Firebase connection function
function getFirestoreClient() {
    try {
        // Option 1: Using service account key file (recommended for production)
        if (file_exists(FIREBASE_KEY_FILE)) {
            $firestore = new FirestoreClient([
                'projectId' => FIREBASE_PROJECT_ID,
                'keyFilePath' => FIREBASE_KEY_FILE
            ]);
        } 
        // Option 2: Using environment variables (for development)
        else {
            $firestore = new FirestoreClient([
                'projectId' => FIREBASE_PROJECT_ID
            ]);
        }
        
        return $firestore;
    } catch (Exception $e) {
        error_log("Firebase connection failed: " . $e->getMessage());
        return null;
    }
}

// CORS headers
function setCORSHeaders() {
    header("Access-Control-Allow-Origin: *");
    header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
    header("Access-Control-Allow-Headers: Content-Type, Authorization");
    header("Content-Type: application/json; charset=UTF-8");
    
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(200);
        exit();
    }
}

// Response helper functions
function sendJSONResponse($data, $statusCode = 200) {
    http_response_code($statusCode);
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit();
}

function sendErrorResponse($message, $statusCode = 400) {
    sendJSONResponse(['error' => $message], $statusCode);
}

function sendSuccessResponse($data = null, $message = 'Success') {
    $response = ['success' => true, 'message' => $message];
    if ($data !== null) {
        $response['data'] = $data;
    }
    sendJSONResponse($response);
}

// Firebase helper functions
function addDocument($collection, $data) {
    try {
        $firestore = getFirestoreClient();
        if (!$firestore) {
            return null;
        }
        
        $collectionRef = $firestore->collection($collection);
        $documentRef = $collectionRef->add($data);
        
        return $documentRef->id();
    } catch (Exception $e) {
        error_log("Error adding document to $collection: " . $e->getMessage());
        return null;
    }
}

function getDocuments($collection, $conditions = []) {
    try {
        $firestore = getFirestoreClient();
        if (!$firestore) {
            return [];
        }
        
        $collectionRef = $firestore->collection($collection);
        $query = $collectionRef;
        
        // Apply conditions if provided
        foreach ($conditions as $condition) {
            $query = $query->where($condition['field'], $condition['operator'], $condition['value']);
        }
        
        $documents = $query->documents();
        $results = [];
        
        foreach ($documents as $document) {
            $data = $document->data();
            $data['id'] = $document->id();
            $results[] = $data;
        }
        
        return $results;
    } catch (Exception $e) {
        error_log("Error getting documents from $collection: " . $e->getMessage());
        return [];
    }
}

function updateDocument($collection, $documentId, $data) {
    try {
        $firestore = getFirestoreClient();
        if (!$firestore) {
            return false;
        }
        
        $documentRef = $firestore->collection($collection)->document($documentId);
        $documentRef->set($data, ['merge' => true]);
        
        return true;
    } catch (Exception $e) {
        error_log("Error updating document in $collection: " . $e->getMessage());
        return false;
    }
}

function deleteDocument($collection, $documentId) {
    try {
        $firestore = getFirestoreClient();
        if (!$firestore) {
            return false;
        }
        
        $documentRef = $firestore->collection($collection)->document($documentId);
        $documentRef->delete();
        
        return true;
    } catch (Exception $e) {
        error_log("Error deleting document from $collection: " . $e->getMessage());
        return false;
    }
}
?>
