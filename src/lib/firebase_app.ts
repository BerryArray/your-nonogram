// Import the functions you need from the SDKs you need

import { initializeApp } from "firebase/app";

// TODO: Add SDKs for Firebase products that you want to use

// https://firebase.google.com/docs/web/setup#available-libraries


// Your web app's Firebase configuration

const firebaseConfig = {

  apiKey: "AIzaSyCMBMn6dwVSZZ5tmKu7_WAr74iJExWIZ2A",

  authDomain: "your-nonogram.firebaseapp.com",

  databaseURL: "https://your-nonogram-default-rtdb.europe-west1.firebasedatabase.app",

  projectId: "your-nonogram",

  storageBucket: "your-nonogram.appspot.com",

  messagingSenderId: "703075178571",

  appId: "1:703075178571:web:053256fd15c78ed6f015ce"

};


// Initialize Firebase

export const app = initializeApp(firebaseConfig);