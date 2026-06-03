import admin from "firebase-admin"

type FirebaseServiceAccount = {
  project_id?: string
  client_email?: string
  private_key?: string
  [key: string]: unknown
}

function getServiceAccountFromEnv(): FirebaseServiceAccount {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
  if (!raw) {
    throw new Error("Missing FIREBASE_SERVICE_ACCOUNT_KEY env var")
  }

  // Věřer může dávat buď JSON string, nebo escaped JSON
  // Ošetříme oba případy tím, že se pokusíme o JSON.parse.
  try {
    return JSON.parse(raw) as FirebaseServiceAccount
  } catch {
    // fallback: pokud už to není JSON, ale například base64, neumíme bez další logiky
    throw new Error("FIREBASE_SERVICE_ACCOUNT_KEY is not valid JSON")
  }
}

function initAdmin() {
  if (admin.apps.length > 0) return

  const serviceAccount = getServiceAccountFromEnv()

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
  })
}

export function getFirestore() {
  initAdmin()
  return admin.firestore()
}

export function getAdmin() {
  initAdmin()
  return admin
}
