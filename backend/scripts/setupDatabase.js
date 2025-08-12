const db = require('../config/database');

const createTables = async () => {
  try {
    // Users table
    await db.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        google_id VARCHAR(255) UNIQUE,
        email VARCHAR(255) UNIQUE NOT NULL,
        username VARCHAR(255) UNIQUE NOT NULL,
        display_name VARCHAR(255),
        profile_image VARCHAR(500),
        bio TEXT,
        theme_preference VARCHAR(10) DEFAULT 'light',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Ensure new auth columns exist
    await db.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255)`);
    await db.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false`);

    // Posts table
    await db.query(`
      CREATE TABLE IF NOT EXISTS posts (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        tags TEXT[],
        is_published BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Comments table
    await db.query(`
      CREATE TABLE IF NOT EXISTS comments (
        id SERIAL PRIMARY KEY,
        post_id INTEGER REFERENCES posts(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Likes table
    await db.query(`
      CREATE TABLE IF NOT EXISTS likes (
        id SERIAL PRIMARY KEY,
        post_id INTEGER REFERENCES posts(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(post_id, user_id)
      )
    `);

    // Followers table
    await db.query(`
      CREATE TABLE IF NOT EXISTS followers (
        id SERIAL PRIMARY KEY,
        follower_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        following_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(follower_id, following_id)
      )
    `);

    // Chats table
    await db.query(`
      CREATE TABLE IF NOT EXISTS chats (
        id SERIAL PRIMARY KEY,
        user1_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        user2_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user1_id, user2_id)
      )
    `);

    // Messages table
    await db.query(`
      CREATE TABLE IF NOT EXISTS messages (
        id SERIAL PRIMARY KEY,
        chat_id INTEGER REFERENCES chats(id) ON DELETE CASCADE,
        sender_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        is_read BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // AI writing samples table
    await db.query(`
      CREATE TABLE IF NOT EXISTS ai_writing_samples (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create indexes for better performance
    await db.query(`CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(user_id)`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC)`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id)`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_likes_post_id ON likes(post_id)`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_followers_following_id ON followers(following_id)`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_messages_chat_id ON messages(chat_id)`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC)`);

    console.log('Database tables created/updated successfully!');
  } catch (error) {
    console.error('Error creating tables:', error);
    process.exit(1);
  }
};

const seedData = async () => {
  try {
    // Check if we already have users
    const { rows } = await db.query('SELECT COUNT(*) FROM users');
    if (parseInt(rows[0].count) > 0) {
      console.log('Database already has data, skipping seed.');
      return;
    }

    // Insert sample users
    await db.query(`
      INSERT INTO users (google_id, email, username, display_name, bio, email_verified) VALUES
      ('sample_google_id_1', 'john@example.com', 'john_doe', 'John Doe', 'A passionate writer exploring new worlds through words.', true),
      ('sample_google_id_2', 'jane@example.com', 'jane_smith', 'Jane Smith', 'Poetry enthusiast and creative writing teacher.', true)
    `);

    console.log('Sample data seeded successfully!');
  } catch (error) {
    console.error('Error seeding data:', error);
  }
};

const setupDatabase = async () => {
  try {
    await createTables();
    await seedData();
    console.log('Database setup completed!');
    process.exit(0);
  } catch (error) {
    console.error('Database setup failed:', error);
    process.exit(1);
  }
};

setupDatabase();
