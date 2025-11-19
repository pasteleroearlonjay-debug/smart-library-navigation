<?php
require_once 'config.php';

setCORSHeaders();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendErrorResponse('Method not allowed', 405);
}

// Get JSON input
$input = json_decode(file_get_contents('php://input'), true);

if (!$input || !isset($input['query'])) {
    sendErrorResponse('Search query is required');
}

$searchQuery = trim($input['query']);

if (empty($searchQuery)) {
    sendErrorResponse('Search query cannot be empty');
}

try {
    $firestore = getFirestoreClient();
    
    if (!$firestore) {
        sendErrorResponse('Firebase connection failed', 500);
    }
    
    // Search for books by title, author, or subject
    $books = [];
    $searchTerm = strtolower($searchQuery);
    
    // Get all books from Firestore
    $booksCollection = $firestore->collection('books');
    $documents = $booksCollection->documents();
    
    foreach ($documents as $document) {
        $book = $document->data();
        $book['id'] = $document->id();
        
        // Search in title, author, and subject (case-insensitive)
        if (strpos(strtolower($book['title']), $searchTerm) !== false ||
            strpos(strtolower($book['author']), $searchTerm) !== false ||
            strpos(strtolower($book['subject']), $searchTerm) !== false) {
            $books[] = $book;
        }
    }
    
    // Sort books by title
    usort($books, function($a, $b) {
        return strcmp($a['title'], $b['title']);
    });
    
    if (empty($books)) {
        sendSuccessResponse([], 'No books found for: ' . $searchQuery);
    }
    
    // Group books by subject for LED control
    $subjectsFound = [];
    foreach ($books as $book) {
        if (!in_array($book['subject'], $subjectsFound)) {
            $subjectsFound[] = $book['subject'];
        }
    }
    
    // Trigger LED lighting for found subjects
    $ledCommands = [];
    foreach ($subjectsFound as $subject) {
        if (isset(LED_PINS[$subject])) {
            $ledPin = LED_PINS[$subject];
            
            // Send LED ON command to the Next.js API
            $ledCommands[] = [
                'subject' => $subject,
                'ledPin' => $ledPin,
                'state' => 'on'
            ];
            
            // Call the Next.js API to turn on the LED
            triggerLEDLighting($subject, $ledPin, 'on');
        }
    }
    
    // Log the search activity
    logSearchActivity($searchQuery, count($books), $subjectsFound);
    
    sendSuccessResponse([
        'books' => $books,
        'total_found' => count($books),
        'subjects_found' => $subjectsFound,
        'led_commands' => $ledCommands
    ], 'Found ' . count($books) . ' book(s) for: ' . $searchQuery);
    
} catch (Exception $e) {
    error_log("General error: " . $e->getMessage());
    sendErrorResponse('An error occurred', 500);
}

/**
 * Trigger LED lighting by calling the Next.js API
 */
function triggerLEDLighting($subject, $ledPin, $state) {
    $url = API_BASE_URL . '/api/led/control';
    
    $data = [
        'subject' => $subject,
        'ledPin' => $ledPin,
        'state' => $state
    ];
    
    $options = [
        'http' => [
            'header' => "Content-type: application/json\r\n",
            'method' => 'POST',
            'content' => json_encode($data)
        ]
    ];
    
    $context = stream_context_create($options);
    
    try {
        $result = file_get_contents($url, false, $context);
        if ($result === false) {
            error_log("Failed to trigger LED lighting for subject: $subject");
        } else {
            error_log("LED lighting triggered for subject: $subject, LED pin: $ledPin");
        }
    } catch (Exception $e) {
        error_log("Error triggering LED lighting: " . $e->getMessage());
    }
}

/**
 * Log search activity to Firebase
 */
function logSearchActivity($query, $resultsCount, $subjectsFound) {
    try {
        $searchLog = [
            'search_query' => $query,
            'results_count' => $resultsCount,
            'subjects_found' => $subjectsFound,
            'created_at' => date('Y-m-d H:i:s')
        ];
        
        addDocument('search_logs', $searchLog);
    } catch (Exception $e) {
        error_log("Failed to log search activity: " . $e->getMessage());
    }
}
?>
