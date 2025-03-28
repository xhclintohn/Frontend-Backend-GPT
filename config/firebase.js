const admin = require("firebase-admin");
const serviceAccount = require("../firebase-service-account.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: "frezra-messager.appspot.com", // Replace with your Firebase Storage bucket
});

const bucket = admin.storage().bucket();
module.exports = { admin, bucket };
