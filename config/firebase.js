const admin = require("firebase-admin");
const serviceAccount = require("../healthhub-e51c8-7ff8b85f5461.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const sendNotification = async (tokens, message) => {
  const payload = {
    notification: {
      title: message.title,
      body: message.body,
    },
  };

  try {
    // Ensure tokens is an array
    if (!Array.isArray(tokens) || tokens.length === 0) {
      console.error("No valid tokens provided.");
      return;
    }

    console.log("tokens===========", tokens)
    console.log("payload===", payload)
    for (const token of tokens) {
      try {
        const response = await admin.messaging().send({
          token,
          notification: payload.notification,
        });
        console.log("Notification sent to token:", token);
        console.log("response----", response);
      } catch (error) {
        console.error(`Error sending notification to token: ${token}`, error);
      }
    }
  } catch (error) {
    console.error("Error sending notifications:", error);
  }
};

module.exports = {
  admin,
  sendNotification,
};
