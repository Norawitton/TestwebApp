import { initializeApp } from 'firebase/app'
import { getDatabase } from 'firebase/database'

const firebaseConfig = {
  apiKey: "AIzaSyCLXHby1v_-RC7I8P570ppNxgc1v56Y1Xk",
  authDomain: "homie-app-e90d8.firebaseapp.com",
  databaseURL: "https://homie-app-e90d8-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "homie-app-e90d8",
  storageBucket: "homie-app-e90d8.firebasestorage.app",
  messagingSenderId: "847478300228",
  appId: "1:847478300228:web:aa66823a2abc4c992e6611",
}

const firebaseApp = initializeApp(firebaseConfig)
export const db = getDatabase(firebaseApp)
