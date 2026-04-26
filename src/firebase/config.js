import { initializeApp } from 'firebase/app'
import { getAnalytics, isSupported } from 'firebase/analytics'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: 'AIzaSyAKOUJstzmlSznYJOneGXuJP1sQOOAQvss',
  authDomain: 'projectdevframework.firebaseapp.com',
  projectId: 'projectdevframework',
  storageBucket: 'projectdevframework.firebasestorage.app',
  messagingSenderId: '794037652963',
  appId: '1:794037652963:web:ee63dbdd6bad97f03ee4d6',
  measurementId: 'G-7PTS70RXPM',
}

const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

let analyticsPromise = null

if (typeof window !== 'undefined') {
  analyticsPromise = isSupported()
    .then((supported) => {
      if (supported) {
        return getAnalytics(app)
      }

      return null
    })
    .catch(() => null)
}

export { app, analyticsPromise, db }
