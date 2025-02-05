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
    for (const token of tokens) {
      try {
        const response = await admin.messaging().send({
          token,
          notification: payload.notification,
        });
        console.log("Notification sent to token:", token);
      } catch (error) {
        console.error(`Error sending notification to token: ${token}`, error);
      }
    }
  } catch (error) {
    console.error("Error sending notifications:", error);
  }
};

const chunkArray = (arr, size) => {
  return arr.reduce((acc, _, i) => {
    if (i % size === 0) acc.push(arr.slice(i, i + size));
    return acc;
  }, []);
};

const sendDoctorNotification = async (tokens, message) => {
  const uniqueFcmTokens = [...new Set(tokens)];
  const payload = {
    notification: {
      title: message.title,
      body: message.body,
    },
    data: message.data
  };

  try {
    const chunks = chunkArray(uniqueFcmTokens, 500);
    const sendPromises = chunks.map(async (chunk) => {
      return admin.messaging().sendEachForMulticast({
        tokens: chunk,
        notification: payload.notification,
        data: payload.data
      });
    });

    const responses = await Promise.all(sendPromises);
    responses.forEach((response, index) => {
      console.info(`Batch ${index + 1} sent with ${response.successCount} successes.`);
    });
  } catch (error) {
    console.error('Error sending notifications:', error);
  }
};

module.exports = {
  admin,
  sendNotification,
  sendDoctorNotification
};
