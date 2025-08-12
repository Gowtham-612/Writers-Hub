const db = require('../config/database');

const setupSocketHandlers = (io) => {
  const connectedUsers = new Map(); // userId -> socketId

  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // Authenticate user and store connection
    socket.on('authenticate', async (userId) => {
      try {
        // Verify user exists
        const { rows } = await db.query('SELECT id, username, display_name FROM users WHERE id = $1', [userId]);
        
        if (rows.length === 0) {
          socket.emit('auth_error', { message: 'Invalid user' });
          return;
        }

        const user = rows[0];
        connectedUsers.set(userId, socket.id);
        socket.userId = userId;
        socket.user = user;

        // Join user to their personal room
        socket.join(`user_${userId}`);

        // Emit online status to user's contacts
        socket.broadcast.emit('user_online', {
          userId: userId,
          username: user.username,
          display_name: user.display_name
        });

        console.log(`User ${user.username} authenticated`);
        socket.emit('authenticated', { user });
      } catch (error) {
        console.error('Authentication error:', error);
        socket.emit('auth_error', { message: 'Authentication failed' });
      }
    });

    // Handle new message
    socket.on('send_message', async (data) => {
      try {
        const { chatId, content } = data;
        
        if (!socket.userId) {
          socket.emit('error', { message: 'Not authenticated' });
          return;
        }

        // Save message to database
        const { rows } = await db.query(
          `INSERT INTO messages (chat_id, sender_id, content) 
           VALUES ($1, $2, $3) RETURNING *`,
          [chatId, socket.userId, content]
        );

        const message = rows[0];

        // Get chat participants
        const { rows: chatUsers } = await db.query(
          'SELECT user1_id, user2_id FROM chats WHERE id = $1',
          [chatId]
        );

        if (chatUsers.length === 0) {
          socket.emit('error', { message: 'Chat not found' });
          return;
        }

        const otherUserId = chatUsers[0].user1_id === socket.userId 
          ? chatUsers[0].user2_id 
          : chatUsers[0].user1_id;

        // Get user info for the message
        const { rows: userInfo } = await db.query(
          'SELECT username, display_name, profile_image FROM users WHERE id = $1',
          [socket.userId]
        );

        const messageWithUser = {
          ...message,
          ...userInfo[0]
        };

        // Emit to both users in the chat
        io.to(`user_${socket.userId}`).to(`user_${otherUserId}`).emit('new_message', {
          chatId,
          message: messageWithUser
        });

        // Send notification to other user if they're not in the chat
        const otherUserSocketId = connectedUsers.get(otherUserId);
        if (otherUserSocketId && otherUserSocketId !== socket.id) {
          io.to(otherUserSocketId).emit('message_notification', {
            chatId,
            sender: userInfo[0],
            preview: content.substring(0, 50)
          });
        }

      } catch (error) {
        console.error('Error sending message:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Handle typing indicator
    socket.on('typing_start', async (data) => {
      try {
        const { chatId } = data;
        
        if (!socket.userId) return;

        // Get chat participants
        const { rows: chatUsers } = await db.query(
          'SELECT user1_id, user2_id FROM chats WHERE id = $1',
          [chatId]
        );

        if (chatUsers.length === 0) return;

        const otherUserId = chatUsers[0].user1_id === socket.userId 
          ? chatUsers[0].user2_id 
          : chatUsers[0].user1_id;

        // Emit typing indicator to other user
        io.to(`user_${otherUserId}`).emit('user_typing', {
          chatId,
          userId: socket.userId,
          username: socket.user.username
        });

      } catch (error) {
        console.error('Error handling typing indicator:', error);
      }
    });

    socket.on('typing_stop', async (data) => {
      try {
        const { chatId } = data;
        
        if (!socket.userId) return;

        // Get chat participants
        const { rows: chatUsers } = await db.query(
          'SELECT user1_id, user2_id FROM chats WHERE id = $1',
          [chatId]
        );

        if (chatUsers.length === 0) return;

        const otherUserId = chatUsers[0].user1_id === socket.userId 
          ? chatUsers[0].user2_id 
          : chatUsers[0].user1_id;

        // Emit stop typing to other user
        io.to(`user_${otherUserId}`).emit('user_stopped_typing', {
          chatId,
          userId: socket.userId
        });

      } catch (error) {
        console.error('Error handling stop typing:', error);
      }
    });

    // Handle message read status
    socket.on('mark_read', async (data) => {
      try {
        const { chatId } = data;
        
        if (!socket.userId) return;

        // Mark messages as read in database
        await db.query(
          'UPDATE messages SET is_read = true WHERE chat_id = $1 AND sender_id != $2 AND is_read = false',
          [chatId, socket.userId]
        );

        // Get chat participants
        const { rows: chatUsers } = await db.query(
          'SELECT user1_id, user2_id FROM chats WHERE id = $1',
          [chatId]
        );

        if (chatUsers.length === 0) return;

        const otherUserId = chatUsers[0].user1_id === socket.userId 
          ? chatUsers[0].user2_id 
          : chatUsers[0].user1_id;

        // Notify other user that messages were read
        io.to(`user_${otherUserId}`).emit('messages_read', {
          chatId,
          readBy: socket.userId
        });

      } catch (error) {
        console.error('Error marking messages as read:', error);
      }
    });

    // Handle user joining a chat room
    socket.on('join_chat', (chatId) => {
      socket.join(`chat_${chatId}`);
      console.log(`User ${socket.userId} joined chat ${chatId}`);
    });

    // Handle user leaving a chat room
    socket.on('leave_chat', (chatId) => {
      socket.leave(`chat_${chatId}`);
      console.log(`User ${socket.userId} left chat ${chatId}`);
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      if (socket.userId) {
        connectedUsers.delete(socket.userId);
        
        // Emit offline status
        socket.broadcast.emit('user_offline', {
          userId: socket.userId,
          username: socket.user?.username
        });

        console.log(`User ${socket.user?.username || socket.userId} disconnected`);
      }
    });
  });

  return io;
};

module.exports = { setupSocketHandlers };

