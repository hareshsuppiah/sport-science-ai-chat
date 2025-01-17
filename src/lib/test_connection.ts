import { Pinecone } from '@pinecone-database/pinecone';

async function testConnection() {
    console.log('Testing Pinecone connection...');
    
    // Log environment variables (without revealing full values)
    const pineconeKey = import.meta.env.VITE_PINECONE_API_KEY;
    const pineconeIndex = import.meta.env.VITE_PINECONE_INDEX;
    
    console.log('Pinecone API Key exists:', !!pineconeKey);
    console.log('Pinecone Index exists:', !!pineconeIndex);
    
    try {
        const pc = new Pinecone({
            apiKey: pineconeKey!,
        });

        const index = pc.index(pineconeIndex!);
        
        // List indexes to verify connection
        const indexes = await pc.listIndexes();
        console.log('Available indexes:', indexes);
        
        // Try a simple stats query
        const stats = await index.describeIndexStats();
        console.log('Index stats:', stats);
        
        console.log('Connection test completed successfully');
    } catch (error) {
        console.error('Error testing connection:', error);
    }
}

testConnection(); 