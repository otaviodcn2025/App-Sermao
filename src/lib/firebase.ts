import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase with safety check
const app = initializeApp(firebaseConfig);

export const db = getFirestore(app, (firebaseConfig as any).firestoreDatabaseId);
export const auth = getAuth(app);

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  
  // Specific handling for quota errors
  if (errorMessage.includes('resource-exhausted') || errorMessage.includes('Quota exceeded')) {
    console.warn('Firestore Quota Exceeded detected');
    // We only alert once to avoid spamming if hit by multiple errors
    if (!(window as any).quotaAlerted) {
      alert("⚠️ LIMITE DIÁRIO ATINGIDO (Firebase Quota)\n\nO limite de gravações gratuitas para hoje foi atingido. \n\nO sistema continuará funcionando para CONSULTA E LEITURA, mas NOVAS ALTERAÇÕES (escrever sermões ou anexar livros) não poderão ser salvas até o reset diário da quota (geralmente à meia-noite).\n\nPara evitar isso futuramente, o app agora salva as edições de forma mais espaçada.");
      (window as any).quotaAlerted = true;
      setTimeout(() => { (window as any).quotaAlerted = false; }, 300000); // 5 minutes gate
    }
  }

  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth?.currentUser?.uid,
      email: auth?.currentUser?.email,
      emailVerified: auth?.currentUser?.emailVerified,
      isAnonymous: auth?.currentUser?.isAnonymous,
      tenantId: auth?.currentUser?.tenantId,
      providerInfo: auth?.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}
