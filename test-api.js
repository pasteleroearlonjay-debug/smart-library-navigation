// Simple test script to check if the bulletproof API works
const testAPI = async () => {
  try {
    console.log('Testing bulletproof API...')
    
    const response = await fetch('http://localhost:3000/api/admin/book-requests-bulletproof', {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer test-token',
        'Content-Type': 'application/json'
      }
    })
    
    const data = await response.json()
    console.log('API Response:', JSON.stringify(data, null, 2))
    
    if (data.success) {
      console.log('✅ API is working!')
      console.log(`Found ${data.stats.totalRequests} requests`)
      console.log(`Pending: ${data.stats.pendingRequests}`)
    } else {
      console.log('❌ API returned error:', data.error)
    }
    
  } catch (error) {
    console.error('❌ API test failed:', error.message)
  }
}

testAPI()

