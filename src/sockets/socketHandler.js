/**
 * Socket.io real-time event handlers for SphereTest.
 *
 * - Manages sphere rooms and real-time test sessions
 * - Handles session events, answer submissions, and live leaderboard
 */

const registerSocketHandlers = (io) => {
  // Import models for session tracking and scoring logic
  const Question = require('../models/Question');
  const Sphere = require('../models/Sphere');

  // In-memory storage for session answers: Map<sphereId, Map<userId, {questionId, answer, timestamp}>>
  const sessionAnswers = new Map();

  /**
   * Score a submitted answer based on question type and correct answer
   * Returns: score (0-100), or 0 if answer is incorrect
   */
  async function scoreAnswer(question, submittedAnswer) {
    try {
      switch (question.type) {
        case 'MCQ':
          // For MCQ: compare answer index with correctAnswer index
          if (parseInt(submittedAnswer) === parseInt(question.correctAnswer)) {
            return 100;
          }
          return 0;

        case 'BOOL':
          // For BOOL: compare boolean values
          const submittedBool =
            submittedAnswer === true || submittedAnswer === 'true';
          const correctBool =
            question.correctAnswer === true ||
            question.correctAnswer === 'true';
          return submittedBool === correctBool ? 100 : 0;

        case 'TEXT':
          // For TEXT: case-insensitive string comparison
          const submittedText = String(submittedAnswer).trim().toLowerCase();
          const correctText = String(question.correctAnswer)
            .trim()
            .toLowerCase();
          if (submittedText === correctText) {
            return 100;
          }
          // Partial credit for substring matches
          if (
            correctText.includes(submittedText) ||
            submittedText.includes(correctText)
          ) {
            return 50;
          }
          return 0;

        case 'CODE':
          // For CODE: simple output comparison
          const submittedOutput = String(submittedAnswer).trim().toLowerCase();
          const expectedOutput = String(question.correctAnswer)
            .trim()
            .toLowerCase();
          if (submittedOutput === expectedOutput) {
            return 100;
          }
          // Partial credit for containing expected output
          if (
            submittedOutput.includes(expectedOutput) ||
            expectedOutput.includes(submittedOutput)
          ) {
            return 30;
          }
          return 0;

        default:
          return 0;
      }
    } catch (error) {
      console.error('Error scoring answer:', error);
      return 0;
    }
  }

  io.on('connection', (socket) => {
    // socket.userId and socket.user are set by auth middleware in server.js
    console.log(`🔌 Socket connected: ${socket.id} | User: ${socket.userId}`);

    // Client requests to join a sphere room
    socket.on('join_sphere', (sphereId) => {
      if (!sphereId) return;
      socket.join(sphereId);
      console.log(`Socket ${socket.id} joined sphere room: ${sphereId}`);
    });

    // Admin starts a test session
    socket.on('start_session', async ({ sphereId, startTime }) => {
      if (!sphereId) return;
      console.log(`📢 Session started for sphere: ${sphereId}`);

      try {
        // Update sphere in database to record actual start time
        const now = new Date();
        await Sphere.findByIdAndUpdate(
          sphereId,
          {
            actualStartTime: now,
            sessionStatus: 'ACTIVE',
          },
          { new: true },
        );
      } catch (error) {
        console.error('Error updating sphere session status:', error);
      }

      // Broadcast to all participants in the sphere room
      io.to(sphereId).emit('session_started', {
        sphereId,
        startTime: startTime || new Date(),
        actualStartTime: new Date(),
      });

      // Initialize answer tracking for this session
      if (!sessionAnswers.has(sphereId)) {
        sessionAnswers.set(sphereId, new Map());
      }
    });

    // Student submits an answer
    socket.on(
      'submit_answer',
      async ({ sphereId, questionId, answer, userId }) => {
        if (!sphereId || !questionId || !userId) return;

        try {
          // Fetch question to get correctAnswer and type
          const question = await Question.findById(questionId);
          if (!question) {
            console.error(`Question not found: ${questionId}`);
            return;
          }

          // Score the answer
          const score = await scoreAnswer(question, answer);

          // Store answer with score in memory
          const sphereAnswers = sessionAnswers.get(sphereId) || new Map();
          sphereAnswers.set(userId, {
            questionId,
            answer,
            score,
            timestamp: new Date(),
          });
          sessionAnswers.set(sphereId, sphereAnswers);

          console.log(
            `✅ Answer received from ${userId} for question ${questionId}: ${score} points`,
          );

          // Notify admin of answer received
          io.to(sphereId).emit('answer_received', {
            userId,
            questionId,
            score,
            timestamp: new Date(),
          });

          // Send updated progress to admin
          const answered = sphereAnswers.size;
          io.to(sphereId).emit('progress_update', {
            userId,
            answered,
            total: answered, // In production, track actual total questions
          });

          // Emit leaderboard update after each answer
          emitLeaderboardUpdate(io, sphereId);
        } catch (error) {
          console.error('Error processing answer:', error);
        }
      },
    );

    // Admin ends the session
    socket.on('session_end', async ({ sphereId }) => {
      if (!sphereId) return;
      console.log(`🏁 Session ended for sphere: ${sphereId}`);

      try {
        // Update sphere in database to mark as ended
        await Sphere.findByIdAndUpdate(
          sphereId,
          {
            sessionStatus: 'ENDED',
          },
          { new: true },
        );
      } catch (error) {
        console.error('Error updating sphere session status:', error);
      }

      // Compute final rankings from stored answers
      const sphereAnswers = sessionAnswers.get(sphereId) || new Map();
      const rankings = Array.from(sphereAnswers.entries())
        .map(([userId, { score, timestamp }]) => ({
          userId,
          score: score || 0, // Use actual score computed during answer submission
          timestamp,
        }))
        .sort((a, b) => b.score - a.score || a.timestamp - b.timestamp); // Sort by score (desc), then time

      io.to(sphereId).emit('session_ended', {
        sphereId,
        rankings,
      });

      // Clean up session data
      sessionAnswers.delete(sphereId);
    });

    socket.on('disconnect', () => {
      console.log(`❌ Socket disconnected: ${socket.id}`);
    });
  });

  /**
   * Helper: Emit leaderboard update to a sphere room
   */
  function emitLeaderboardUpdate(io, sphereId) {
    const sphereAnswers = sessionAnswers.get(sphereId) || new Map();
    const rankings = Array.from(sphereAnswers.entries())
      .map(([userId, data]) => ({
        userId,
        score: data.score || 0, // Use actual score from submitted answer
        answered: true,
      }))
      .sort((a, b) => b.score - a.score); // Sort by score descending

    io.to(sphereId).emit('leaderboard_update', {
      sphereId,
      rankings,
    });
  }
};

module.exports = registerSocketHandlers;
