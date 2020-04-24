// Import stylesheets
import './style.css';
// Firebase App (the core Firebase SDK) is always required and must be listed first
import * as firebase from "firebase/app";

// Add the Firebase products that you want to use
import "firebase/auth";
import "firebase/firestore";

import * as firebaseui from 'firebaseui';

// Document elements
const startRsvpButton = document.getElementById('startRsvp');
const guestbookContainer = document.getElementById('guestbook-container');

const form = document.getElementById('leave-message');
const input = document.getElementById('message');
const guestbook = document.getElementById('guestbook');
const numberAttending = document.getElementById('number-attending');
const rsvpYes = document.getElementById('rsvp-yes');
const rsvpNo = document.getElementById('rsvp-no');

var rsvpListener = null;
var guestbookListener = null;

// Add Firebase project configuration object here
  var firebaseConfig = {
    apiKey: "AIzaSyBSSHTHVv52yTUOjeICQB-iEGPTEK9mm-0",
    authDomain: "fir-web-codelab-e821e.firebaseapp.com",
    databaseURL: "https://fir-web-codelab-e821e.firebaseio.com",
    projectId: "fir-web-codelab-e821e",
    storageBucket: "fir-web-codelab-e821e.appspot.com",
    messagingSenderId: "530612562666",
    appId: "1:530612562666:web:9b677e09bfa199ff818593"
  };

firebase.initializeApp(firebaseConfig);

// FirebaseUI config
const uiConfig = {
credentialHelper: firebaseui.auth.CredentialHelper.NONE,
signInOptions: [
// Email / Password Provider.
firebase.auth.EmailAuthProvider.PROVIDER_ID
],
callbacks: {
signInSuccessWithAuthResult: function(authResult, redirectUrl){
// Handle sign-in.
// Return false to avoid redirect.
return false;
}
}
};

const ui = new firebaseui.auth.AuthUI(firebase.auth());

startRsvpButton.addEventListener("click", ()=> {
if (firebase.auth().currentUser) {
firebase.auth().signOut();
} else {
ui.start("#firebaseui-auth-container", uiConfig);
}
});

firebase.auth().onAuthStateChanged((user)=> {
if (user) {
startRsvpButton.textContent = "LOGOUT";
guestbookContainer.style.display = 'block';
subscribeGuestbook();
subscribeCurrentRSVP(user);
} else {
startRsvpButton.textContent = "RSVP";
guestbookContainer.style.display = 'none';
unsubscribeGuestbook();
unsubscribeCurrentRSVP();
}
});

form.addEventListener('submit',(event) => {
  event.preventDefault();

  firebase.firestore().collection('guestbook').add({
    text: input.value,
    timestamp: Date.now(),
    name: firebase.auth().currentUser.displayName,
    userId: firebase.auth().currentUser.uid,
  });

  input.value = '';
});

function subscribeGuestbook() {  
  guestbookListener = firebase.firestore()
    .collection('guestbook')
    .orderBy('timestamp', 'desc')
    .onSnapshot((snaps) => {
      guestbook.innerHTML = '';
      const messages = snaps.docs.map((doc) => {
        const { name, text } = doc.data();
        const entry = document.createElement('p');

        entry.textContent = `${name}: ${text}`;

        return entry;
      });

      messages.map((msg) => guestbook.appendChild(msg));
    });
}

function unsubscribeGuestbook() {
  if (!guestbookListener) {
    return;
  }

  guestbookListener();
  guestbookListener = null;
}

function answerInvitation(response) {
  return () => {
    const payload = { attending: response };
    const userDoc = firebase.firestore()
      .collection('attendees')
      .doc(firebase.auth().currentUser.uid);

    userDoc.set(payload).catch(console.error);
  };
}

rsvpYes.addEventListener('click', answerInvitation(true));
rsvpNo.addEventListener('click', answerInvitation(false));

firebase.firestore()
  .collection('attendees')
  .where('attending', '==', true)
  .onSnapshot((snap) => { 
    numberAttending.textContent = `${snap.docs.length} people going.`;
  });

function subscribeCurrentRSVP(user) {
  rsvpListener = firebase.firestore()
    .collection('attendees')
    .doc(firebase.auth().currentUser.uid)
    .onSnapshot((snap) => {
      let response;

      if (!snap || !snap.data()) {
        return;
      }

      response = snap.data().attending;

      if (response) {
        rsvpYes.className = 'clicked';
        rsvpNo.className = '';
      } else {
        rsvpYes.className = '';
        rsvpNo.className = 'clicked';        
      }
    });
}

function unsubscribeCurrentRSVP() {
  if (!rsvpListener) {
    return;
  }

  rsvpListener();
  rsvpListener = null;
}