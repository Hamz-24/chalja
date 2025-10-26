// Import the functions you need from the SDKs you need
import { getApp, getApps, initializeApp } from "firebase/app";
// import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyDI5r5cf-3usneSrq87aLKgeYIOOvPfv58",
    authDomain: "speakprep-9c73a.firebaseapp.com",
    projectId: "speakprep-9c73a",
    storageBucket: "speakprep-9c73a.firebasestorage.app",
    messagingSenderId: "183931632791",
    appId: "1:183931632791:web:7e305f4dc15e212a877dd2",
    measurementId: "G-FNV1213JDT"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
// const analytics = getAnalytics(app);

export const auth = getAuth(app);
export const db = getFirestore(app);