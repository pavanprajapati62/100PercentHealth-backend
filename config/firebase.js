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

    // Use sendMulticast for sending notifications to multiple devices
    // console.log("tokens===", tokens);
    // console.log("admin=======", admin);
    // console.log("----------", typeof admin.messaging);
    // console.log("kkk", Object.keys(admin.messaging()));
    //   const response = await admin.messaging().sendMulticast({
    //     tokens: tokens,
    //     notification: {
    //       title: message.title,
    //       body: message.body,
    //     },
    //   });
    // const response = await admin.messaging().sendToDevice(tokens, payload);
    for (const token of tokens) {
      const response = await admin.messaging().send({
        token,
        notification: payload.notification,
      });
      console.log("Notification sent to token:", token);
      console.log("response----", response);
    }
  } catch (error) {
    console.error("Error sending notifications:", error);
  }
};

module.exports = {
  admin,
  sendNotification,
};
