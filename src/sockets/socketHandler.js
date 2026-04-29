const registerSocketHandlers = (io) => {
  const Question = require('../models/Question');
  const Sphere = require('../models/Sphere');

  const sessionAnswers = new Map();

  async function scoreAnswer(question, submittedAnswer) {
    try {
      switch (question.type) {
        case 'MCQ':
          if (parseInt(submittedAnswer) === parseInt(question.correctAnswer)) {
            return 100;
          }
          return 0;

        case 'BOOL':
          const submittedBool =
            submittedAnswer === true || submittedAnswer === 'true';
          const correctBool =
            question.correctAnswer === true ||
            question.correctAnswer === 'true';
          return submittedBool === correctBool ? 100 : 0;

        case 'TEXT':
          const submittedText = String(submittedAnswer).trim().toLowerCase();
          const correctText = String(question.correctAnswer)
            .trim()
            .toLowerCase();
          if (submittedText === correctText) {
            return 100;
          }
          if (
            correctText.includes(submittedText) ||
            submittedText.includes(correctText)
          ) {
            return 50;
          }
          return 0;

        case 'CODE':
          const submittedOutput = String(submittedAnswer).trim().toLowerCase();
          const expectedOutput = String(question.correctAnswer)
            .trim()
            .toLowerCase();
          if (submittedOutput === expectedOutput) {
            return 100;
          }
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
    console.log(`🔌 Socket connected: ${socket.id} | User: ${socket.userId}`);

    socket.on('join_sphere', (sphereId) => {
      if (!sphereId) return;
      socket.join(sphereId);
      console.log(`Socket ${socket.id} joined sphere room: ${sphereId}`);
    });

    socket.on('start_session', async ({ sphereId, startTime }) => {
      if (!sphereId) return;
      console.log(`📢 Session started for sphere: ${sphereId}`);

      try {
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

      io.to(sphereId).emit('session_started', {
        sphereId,
        startTime: startTime || new Date(),
        actualStartTime: new Date(),
      });

      if (!sessionAnswers.has(sphereId)) {
        sessionAnswers.set(sphereId, new Map());
      }
    });

    socket.on(
      'submit_answer',
      async ({ sphereId, questionId, answer, userId }) => {
        if (!sphereId || !questionId || !userId) return;

        try {
          const question = await Question.findById(questionId);
          if (!question) {
            console.error(`Question not found: ${questionId}`);
            return;
          }

          const score = await scoreAnswer(question, answer);

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

          io.to(sphereId).emit('answer_received', {
            userId,
            questionId,
            score,
            timestamp: new Date(),
          });

          const answered = sphereAnswers.size;
          io.to(sphereId).emit('progress_update', {
            userId,
            answered,
            total: answered,
          });

          emitLeaderboardUpdate(io, sphereId);
        } catch (error) {
          console.error('Error processing answer:', error);
        }
      },
    );

    socket.on('session_end', async ({ sphereId }) => {
      if (!sphereId) return;
      console.log(`🏁 Session ended for sphere: ${sphereId}`);

      try {
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

      const sphereAnswers = sessionAnswers.get(sphereId) || new Map();
      const rankings = Array.from(sphereAnswers.entries())
        .map(([userId, { score, timestamp }]) => ({
          userId,
          score: score || 0,
          timestamp,
        }))
        .sort((a, b) => b.score - a.score || a.timestamp - b.timestamp);

      io.to(sphereId).emit('session_ended', {
        sphereId,
        rankings,
      });

      sessionAnswers.delete(sphereId);
    });

    socket.on('disconnect', () => {
      console.log(`❌ Socket disconnected: ${socket.id}`);
    });
  });

  function emitLeaderboardUpdate(io, sphereId) {
    const sphereAnswers = sessionAnswers.get(sphereId) || new Map();
    const rankings = Array.from(sphereAnswers.entries())
      .map(([userId, data]) => ({
        userId,
        score: data.score || 0,
        answered: true,
      }))
      .sort((a, b) => b.score - a.score);

    io.to(sphereId).emit('leaderboard_update', {
      sphereId,
      rankings,
    });
  }
};

module.exports = registerSocketHandlers;
