const db = require('./config/database');

const testDatabase = async () => {
  try {
    console.log('🔍 Testing database connection and tables...\n');
    
    // Test basic connection
    const { rows: timeResult } = await db.query('SELECT NOW() as current_time');
    console.log('✅ Database connection successful:', timeResult[0].current_time);
    
    // Check if tables exist
    const tables = [
      'users',
      'posts', 
      'followers',
      'user_chats',
      'user_messages',
      'ai_chat_sessions',
      'ai_chat_messages'
    ];
    
    console.log('\n📋 Checking table existence:');
    for (const table of tables) {
      try {
        const { rows } = await db.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_name = $1
          ) as exists
        `, [table]);
        
        const status = rows[0].exists ? '✅' : '❌';
        console.log(`${status} ${table}`);
      } catch (error) {
        console.log(`❌ ${table} - Error checking:`, error.message);
      }
    }
    
    // Test user chat functionality
    console.log('\n💬 Testing user chat tables:');
    try {
      const { rows: chatResult } = await db.query('SELECT COUNT(*) FROM user_chats');
      console.log(`✅ user_chats table has ${chatResult[0].count} records`);
      
      const { rows: msgResult } = await db.query('SELECT COUNT(*) FROM user_messages');
      console.log(`✅ user_messages table has ${msgResult[0].count} records`);
    } catch (error) {
      console.log('❌ User chat tables error:', error.message);
    }
    
    // Test AI chat functionality
    console.log('\n🤖 Testing AI chat tables:');
    try {
      const { rows: aiSessionResult } = await db.query('SELECT COUNT(*) FROM ai_chat_sessions');
      console.log(`✅ ai_chat_sessions table has ${aiSessionResult[0].count} records`);
      
      const { rows: aiMsgResult } = await db.query('SELECT COUNT(*) FROM ai_chat_messages');
      console.log(`✅ ai_chat_messages table has ${aiMsgResult[0].count} records`);
    } catch (error) {
      console.log('❌ AI chat tables error:', error.message);
    }
    
    console.log('\n🎉 Database test completed!');
    
  } catch (error) {
    console.error('❌ Database test failed:', error);
  } finally {
    process.exit(0);
  }
};

testDatabase();





