const bot = require("../index");
const { getQuiz, getAllQuizNames, deleteAllQuizzes } = require("../core/mongo/quizesdb");


// ------------------ Buttons ------------------ //
const removeAllMarkup = {
  inline_keyboard: [
    [
      { text: "Remove All Quizzes", callback_data: "remove_all_quizzes" }
    ]
  ]
};

// ---------------- My Quiz Command ---------------- //
bot.command("myquiz", async (ctx) => {
  const user_id = ctx.message.from.id;
  const allquizNames = await getAllQuizNames(user_id);

  if (!allquizNames || allquizNames.length === 0) {
    ctx.reply('Quiz not found.');
    return;
  }

  let NameText = 'Here are all your Quiz Names:\n\n';
  const botName = ctx.botInfo.username;

  allquizNames.forEach((name, index) => {
    NameText += `Quiz ${index + 1}\nhttps://t.me/${botName}?start=QuizName_${name}\n\n`;
  });

  await ctx.reply(NameText, {
    reply_markup: removeAllMarkup 
  });
});


// ------------- Actions -------------- //
bot.action('remove_all_quizzes', async (ctx) => {
  const user_id = ctx.from.id;
  await deleteAllQuizzes(user_id);  
  await ctx.answerCbQuery('All quizzes have been removed.');
  await ctx.editMessageText('All quizzes have been removed successfully!');
});




// ------------- Poll Uploader ---------------- //

const userResponses = {};

async function pollUploader(ctx, user_id, name) {
  try {
    const quizDataRaw = await getQuiz(user_id, name);
    const quizData = typeof quizDataRaw === "string" ? JSON.parse(quizDataRaw) : quizDataRaw;

    await ctx.reply(`📝 **Quiz Started**: *${name}* 📚\n\nTotal Questions: ${quizData.length}. Get ready! 🎯`);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    
    // Handle poll answers
    bot.on("poll_answer", (pollAnswer) => {
      try {
        const { user, option_ids } = pollAnswer;

        if (!user || !option_ids) {
          console.warn("Missing user or option_ids in pollAnswer.");
          return;
        }

        const userId = user.id;

        if (!userResponses[userId]) {
          userResponses[userId] = { name: user.first_name, correct: 0, wrong: 0 };
        }

        const lastQuestionIndex = Object.keys(userResponses).length - 1;
        const correctOptionIndex = quizData[lastQuestionIndex].correctAnswer;

        if (option_ids.includes(correctOptionIndex)) {
          userResponses[userId].correct += 1;
        } else {
          userResponses[userId].wrong += 1;
        }
      } catch (error) {
        console.error("Error processing poll answer:", error);
      }
    });

    // Send quiz questions
    for (let i = 0; i < quizData.length; i++) {
      const quiz = quizData[i];
      const question = quiz.question || "Demo";
      const options = Object.values(quiz.options) || [1, 2, 3, 4];
      const correctIndex = quiz.correctAnswer || 0;

      await ctx.sendPoll(question, options, {
        type: "quiz",
        correct_option_id: correctIndex,
        is_anonymous: false,
      });

      console.log(`Waiting for 15 seconds before sending the next poll...`);
      await new Promise((resolve) => setTimeout(resolve, 15000));
    }

    // Handle the case when no one has responded
    if (Object.keys(userResponses).length === 0) {
      await ctx.reply("📊 **No participants responded to the quiz.**");
      return;
    }

    // Sort and display results
    const sortedResults = Object.values(userResponses).sort((a, b) => b.correct - a.correct);
    let resultsMessage = "🎉 **Quiz Completed Successfully!** 🎉\n\n🏆 **Results:**\n\n";

    sortedResults.forEach((user, index) => {
      resultsMessage += `**${index + 1}. ${user.name}** - ✅ Correct: ${user.correct}, ❌ Wrong: ${user.wrong}\n`;
    });

    // Check if the results message exceeds the character limit
    if (resultsMessage.length > 4096) {
      const fs = require("fs");
      const filePath = "/mnt/data/quiz_results.txt";
      fs.writeFileSync(filePath, resultsMessage);
      await ctx.replyWithDocument({ source: filePath, filename: "quiz_results.txt" });
    } else {
      await ctx.reply(resultsMessage);
    }

    await new Promise((resolve) => setTimeout(resolve, 5000));
    await ctx.reply("🎯 **Thank you for participating!** 🥳");

  } catch (error) {
    console.error("Error uploading poll:", error);
    await ctx.reply("❌ Failed to upload the poll. Please try again.");
  }
}




module.exports = { pollUploader };
