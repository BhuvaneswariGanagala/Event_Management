const db = require('../db/utils');
const Home = async (req, res) => {
    try {
        res.send("from home");
    } catch (error) {
        console.log(error);
    }
}
const Register = async (req, res) => {
    const { name, email } = req.body;

    if (!name || !email) {
        return res.status(400).json({ error: 'Name and Email are required' });
    }

    try {
        const query = `
        INSERT INTO users (name, email)
        VALUES ($1, $2)
        RETURNING id
      `;

        const result = await db.query(query, [name, email]);
        const userId = result.rows[0].id;

        res.status(201).json({
            message: 'User registered successfully!',
            userId,
        });
    } catch (error) {
        console.error('🔥 Database error:', error); // Add this line

        // Send back full error for now (for debugging only)
        res.status(500).json({ error: error.message });
    }
};
const RegisterForEvent = async (req, res) => {
    const { eventId } = req.params;
    const { userId } = req.body;
  
    try {
      // 1. Check if event exists
      const eventResult = await db.query('SELECT * FROM events WHERE id = $1', [eventId]);
      if (eventResult.rowCount === 0) return res.status(404).json({ error: 'Event not found' });
  
      // 2. Check if user exists
      const userResult = await db.query('SELECT * FROM users WHERE id = $1', [userId]);
      if (userResult.rowCount === 0) return res.status(404).json({ error: 'User not found' });
  
      const event = eventResult.rows[0];
  
      // 3. Check if event is in the past
      const now = new Date();
      if (new Date(event.date) < now) {
        return res.status(400).json({ error: 'Cannot register for a past event' });
      }
  
      // 4. Check if event is full
      const countResult = await db.query(
        'SELECT COUNT(*) FROM registrations WHERE event_id = $1',
        [eventId]
      );
      const registeredCount = parseInt(countResult.rows[0].count);
      if (registeredCount >= event.capacity) {
        return res.status(400).json({ error: 'Event is already full' });
      }
  
      // 5. Check for duplicate registration
      const duplicateCheck = await db.query(
        'SELECT * FROM registrations WHERE user_id = $1 AND event_id = $2',
        [userId, eventId]
      );
      if (duplicateCheck.rowCount > 0) {
        return res.status(409).json({ error: 'User is already registered for this event' });
      }
  
      // 6. Register the user
      await db.query(
        'INSERT INTO registrations (user_id, event_id) VALUES ($1, $2)',
        [userId, eventId]
      );
  
      res.status(201).json({
        message: 'User successfully registered for the event'
      });
  
    } catch (error) {
      console.error('❌ Error in RegisterForEvent:', error);
      res.status(500).json({ error: error.message });
    }
  };
  const CancelRegistration = async (req, res) => {
    const { eventId } = req.params;
    const { userId } = req.body;
  
    try {
      // 1. Check if event exists
      const eventResult = await db.query('SELECT * FROM events WHERE id = $1', [eventId]);
      if (eventResult.rowCount === 0) {
        return res.status(404).json({ error: 'Event not found' });
      }
  
      // 2. Check if user exists
      const userResult = await db.query('SELECT * FROM users WHERE id = $1', [userId]);
      if (userResult.rowCount === 0) {
        return res.status(404).json({ error: 'User not found' });
      }
  
      // 3. Check if user is registered
      const registrationCheck = await db.query(
        'SELECT * FROM registrations WHERE user_id = $1 AND event_id = $2',
        [userId, eventId]
      );
  
      if (registrationCheck.rowCount === 0) {
        return res.status(400).json({ error: 'User is not registered for this event' });
      }
  
      // 4. Cancel registration
      await db.query(
        'DELETE FROM registrations WHERE user_id = $1 AND event_id = $2',
        [userId, eventId]
      );
  
      res.status(200).json({ message: 'User successfully unregistered from the event' });
  
    } catch (error) {
      console.error('❌ Error in CancelRegistration:', error);
      res.status(500).json({ error: error.message });
    }
  };
  const GetEventDetails = async (req, res) => {
    const { eventId } = req.params;
  
    try {
      // 1. Get event info
      const eventResult = await db.query('SELECT * FROM events WHERE id = $1', [eventId]);
  
      if (eventResult.rowCount === 0) {
        return res.status(404).json({ error: 'Event not found' });
      }
  
      const event = eventResult.rows[0];
  
      // 2. Get registered users
      const usersResult = await db.query(`
        SELECT u.id, u.name, u.email
        FROM users u
        JOIN registrations r ON u.id = r.user_id
        WHERE r.event_id = $1
      `, [eventId]);
  
      // 3. Send combined response
      res.status(200).json({
        event,
        registeredUsers: usersResult.rows
      });
  
    } catch (error) {
      console.error('❌ Error in GetEventDetails:', error);
      res.status(500).json({ error: error.message });
    }
  };
  const GetUpcomingEvents = async (req, res) => {
    try {
      const now = new Date();
  
      const result = await db.query(`
        SELECT * FROM events
        WHERE date > $1
        ORDER BY date ASC, location ASC
      `, [now]);
  
      res.status(200).json({
        upcomingEvents: result.rows
      });
  
    } catch (error) {
      console.error('❌ Error in GetUpcomingEvents:', error);
      res.status(500).json({ error: error.message });
    }
  };
  const GetEventStats = async (req, res) => {
    const { eventId } = req.params;
  
    try {
      // 1. Check if event exists
      const eventResult = await db.query('SELECT * FROM events WHERE id = $1', [eventId]);
  
      if (eventResult.rowCount === 0) {
        return res.status(404).json({ error: 'Event not found' });
      }
  
      const event = eventResult.rows[0];
      const capacity = event.capacity;
  
      // 2. Count registrations
      const countResult = await db.query(
        'SELECT COUNT(*) FROM registrations WHERE event_id = $1',
        [eventId]
      );
  
      const totalRegistrations = parseInt(countResult.rows[0].count);
      const remainingCapacity = capacity - totalRegistrations;
      const percentUsed = ((totalRegistrations / capacity) * 100).toFixed(2);
  
      // 3. Respond with stats
      res.status(200).json({
        eventId: event.id,
        title: event.title,
        totalRegistrations,
        remainingCapacity,
        percentUsed: `${percentUsed}%`
      });
  
    } catch (error) {
      console.error('❌ Error in GetEventStats:', error);
      res.status(500).json({ error: error.message });
    }
  };

module.exports = { Home, Register, RegisterForEvent,
    CancelRegistration,GetEventDetails,GetUpcomingEvents,GetEventStats};