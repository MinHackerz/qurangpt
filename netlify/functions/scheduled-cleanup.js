const { getStore } = require('@netlify/blobs');
const { schedule } = require('@netlify/functions');

const handler = async (event, context) => {
  try {
    console.log('🧹 Scheduled cleanup started at:', new Date().toISOString());
    
    // Get the blob store
    const blobStore = getStore('quran-gpt-shares');
    
    // Calculate 7 days ago timestamp
    const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    let deletedCount = 0;
    let errorCount = 0;
    
    try {
      // List all blobs
      const listResult = await blobStore.list();
      const blobs = listResult.blobs || [];
      
      console.log(`📋 Found ${blobs.length} blobs to check`);
      
      for (const blob of blobs) {
        if (blob.key.startsWith('share-')) {
          try {
            // Get the blob data
            const data = await blobStore.get(blob.key);
            if (data) {
              const content = JSON.parse(data);
              
              // Check if content is expired
              if (content.timestamp && content.timestamp < sevenDaysAgo) {
                await blobStore.delete(blob.key);
                deletedCount++;
                console.log(`🗑️  Deleted expired content: ${blob.key}`);
              }
            }
          } catch (err) {
            // If we can't parse or access the blob, try to delete it
            try {
              await blobStore.delete(blob.key);
              deletedCount++;
              console.log(`🗑️  Deleted inaccessible blob: ${blob.key}`);
            } catch (deleteErr) {
              errorCount++;
              console.error(`❌ Failed to delete blob ${blob.key}:`, deleteErr.message);
            }
          }
        }
      }
      
      console.log(`✅ Cleanup completed: ${deletedCount} items deleted, ${errorCount} errors`);
      
      return {
        statusCode: 200,
        body: JSON.stringify({
          success: true,
          deletedCount,
          errorCount,
          timestamp: new Date().toISOString()
        })
      };
      
    } catch (listError) {
      console.error('❌ Error listing blobs:', listError);
      return {
        statusCode: 500,
        body: JSON.stringify({
          success: false,
          error: 'Failed to list blobs',
          message: listError.message
        })
      };
    }
    
  } catch (error) {
    console.error('❌ Scheduled cleanup failed:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        error: 'Scheduled cleanup failed',
        message: error.message
      })
    };
  }
};

exports.handler = schedule('0 2 * * *', handler);
