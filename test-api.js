// Test the hadith API directly
const testAPI = async () => {
  try {
    console.log('🔍 Testing Hadith API...');
    
    // Test with a simple query
    const response = await fetch('http://localhost:3000/api/hadith?query=prophet&limit=3');
    
    console.log('📊 Response status:', response.status);
    console.log('📊 Response headers:', Object.fromEntries(response.headers.entries()));
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Error response:', errorText);
      return;
    }
    
    const data = await response.json();
    console.log('✅ Success response:', JSON.stringify(data, null, 2));
    
  } catch (error) {
    console.error('❌ Test error:', error);
  }
};

testAPI();
