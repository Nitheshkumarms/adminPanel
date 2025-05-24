// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyCzwcUBKdxCaGshMmoXO1Cqven5e-LQnYU",
    authDomain: "feedencoder.firebaseapp.com",
    projectId: "feedencoder",
    storageBucket: "feedencoder.appspot.com",
    messagingSenderId: "904577806120",
    appId: "1:904577806120:web:c663f621d01ceeba12aa1d",
    measurementId: "G-386008MT7T"
};

// Initialize Firebase
const app = firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// Enable offline persistence with error handling
db.enablePersistence()
  .catch((err) => {
      console.error("Firestore offline persistence error:", err);
      if (err.code === 'failed-precondition') {
          console.warn("Multiple tabs open, persistence can only be enabled in one tab at a time.");
      } else if (err.code === 'unimplemented') {
          console.warn("The current browser does not support all of the features required to enable persistence");
      }
  });

// Set auth persistence
auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL)
  .catch((error) => {
      console.error("Auth persistence error:", error);
  });