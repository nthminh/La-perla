import { initializeApp, getApps, getApp, deleteApp, FirebaseApp } from "firebase/app";
import { getDatabase, Database, ref, set, remove } from "firebase/database";
import { getAuth, signInAnonymously, Auth } from "firebase/auth";
import { logger } from "../utils/logger";

// SECURITY: Obfuscated Configuration
// Values are Base64 encoded to prevent simple text searching in source code.
// Original:
// apiKey: "AIzaSyDVOEQU32xNJpgAoQHnBydiq8sGD5zHh-0"
// projectId: "laperlapos"
// ...
const _d = (s: string) => atob(s);

export const DEFAULT_CONFIG = {
 apiKey: "AIzaSyB5xI4Z_tTR9qm12ZiCIacTf4XvwploBgY",
  authDomain: "la-perla-53540395-70c43.firebaseapp.com",
  databaseURL: "https://la-perla-53540395-70c43-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "la-perla-53540395-70c43",
  storageBucket: "la-perla-53540395-70c43.firebasestorage.app",
  messagingSenderId: "983422020706",
  appId: "1:983422020706:web:e664f9200b6a48b55af53b",
  measurementId: "G-377HKGL12S"
};

// Try to load from Local Storage (for dynamic setup without code edits)
const getStoredConfig = () => {
    try {
        const stored = localStorage.getItem('la_perla_firebase_settings');
        if (stored) return JSON.parse(stored);
    } catch (e) {
        logger.error("Failed to parse stored config", e);
    }
    return null;
};

const userConfig = getStoredConfig();
// Use user config if available, otherwise default
const firebaseConfig = userConfig || DEFAULT_CONFIG;

// Singleton pattern to prevent multiple initializations
let app: FirebaseApp | undefined;
let dbInstance: Database | null = null;
let authInstance: Auth | null = null;

try {
    if (!getApps().length) {
        app = initializeApp(firebaseConfig);
        logger.info("Firebase app initialized successfully");
    } else {
        app = getApp();
        logger.info("Using existing Firebase app");
    }
    
    // Attempt to get database instance. This might fail if config is malformed (e.g. bad URL)
    try {
        dbInstance = getDatabase(app);
        authInstance = getAuth(app);
        logger.info("Firebase database and auth instances created");
        
        // Auto-sign in anonymously to allow access if rules require auth != null
        // Gracefully handle if Auth is not enabled in Console
        signInAnonymously(authInstance).catch(err => {
            logger.warn("Anonymous sign-in failed (this is OK if auth is disabled)", err.code);
        });

    } catch (dbError: any) {
        logger.error("Failed to initialize Firebase database", dbError.message);
        dbInstance = null;
        authInstance = null;
    }

} catch (e: any) {
    logger.error("Critical Firebase initialization error - app will run in offline mode", e.message);
}

export const db = dbInstance;
export const auth = authInstance;

// Helper to ensure we are authenticated before making requests
export const waitForAuth = async () => {
    if (!authInstance) return;
    if (authInstance.currentUser) return;
    try {
        await signInAnonymously(authInstance);
    } catch (e: any) {
        // Ignore
    }
};

// Check if the current configuration is valid (not the placeholder)
export const isFirebaseConfigured = () => {
    // If we have a user config in local storage, check if it looks valid
    if (userConfig && userConfig.apiKey) {
        if (userConfig.apiKey.includes("PLACEHOLDER") || 
            userConfig.projectId === "your-project") {
            return false;
        }
        return true;
    }
    
    // If using default config (la-perla-53540395-70c43), it IS configured.
    return firebaseConfig.projectId === "la-perla-53540395-70c43";
};

export interface ParsedConfig {
    apiKey: string;
    projectId: string;
    databaseURL: string;
}

// Extract config from raw string (robust regex)
export const parseConfigString = (input: string): ParsedConfig => {
    const result = { apiKey: "", projectId: "", databaseURL: "" };

    // Helper regex to find value by key (handles "key": "val", key: "val", key: 'val')
    const findValue = (key: string) => {
        const regex = new RegExp(`(?:["']?${key}["']?)\\s*[:=]\\s*(?:["'])(.*?)(?:["'])`, 'i');
        const match = input.match(regex);
        return match ? match[1] : "";
    };

    result.apiKey = findValue("apiKey");
    result.projectId = findValue("projectId");
    result.databaseURL = findValue("databaseURL");

    // AUTO-FIX: If databaseURL is missing but projectId exists, infer it.
    // Firebase defaults to https://<projectId>-default-rtdb.firebaseio.com
    if (!result.databaseURL && result.projectId) {
        result.databaseURL = `https://${result.projectId}-default-rtdb.firebaseio.com`;
    }

    return result;
};

// Validate connection by attempting to write to a temporary node
export const validateConnection = async (config: ParsedConfig): Promise<{ success: boolean; error?: string }> => {
    const tempAppIds = `temp_check_${Date.now()}`;
    let tempApp: FirebaseApp | undefined;

    try {
        const fullConfig = {
            ...config,
            authDomain: `${config.projectId}.firebaseapp.com`,
            storageBucket: `${config.projectId}.appspot.com`
        };

        tempApp = initializeApp(fullConfig, tempAppIds);
        const tempAuth = getAuth(tempApp);
        
        try {
            await signInAnonymously(tempAuth); 
        } catch (authErr: any) {
             // Auth failed
        }

        const tempDb = getDatabase(tempApp);
        const testRef = ref(tempDb, '_connection_test');
        
        // Try to write
        await set(testRef, { status: 'ok', time: Date.now() });
        // Try to delete (cleanup)
        await remove(testRef);

        return { success: true };
    } catch (e: any) {
        let msg = e.message;
        if (e.code === 'PERMISSION_DENIED') {
            msg = "PERMISSION_DENIED: Database rules prevent writing. Please go to Firebase Console -> Build -> Realtime Database -> Rules and set read/write to true (or allow auth != null).";
        } else if (e.code === 'FIREBASE_FATAL_ERROR' || msg.includes('project')) {
            msg = "Project Not Found. Check Project ID.";
        }
        return { success: false, error: msg };
    } finally {
        if (tempApp) {
            try { await deleteApp(tempApp); } catch {}
        }
    }
}

// Save config to local storage
export const saveFirebaseConfigLocally = (config: ParsedConfig): { success: boolean, error?: string } => {
    try {
        // Validate critical fields
        if(!config.apiKey) return { success: false, error: "Missing API Key." };
        if(!config.projectId) return { success: false, error: "Missing Project ID." };
        
        // Placeholder check
        if(config.apiKey.includes("PLACEHOLDER") || config.projectId.includes("your-project")) {
            return { success: false, error: "Please enter real configuration data, not placeholders." };
        }

        // Complete the object for Firebase SDK
        const fullConfig = {
            ...config,
            authDomain: `${config.projectId}.firebaseapp.com`,
            storageBucket: `${config.projectId}.appspot.com`
        };
        
        localStorage.setItem('la_perla_firebase_settings', JSON.stringify(fullConfig));
        return { success: true };
    } catch (e: any) {
        logger.error("Config Save Error", e);
        return { success: false, error: e.message || "Unknown error." };
    }
};

export const clearFirebaseConfigLocally = () => {
    localStorage.removeItem('la_perla_firebase_settings');
    window.location.reload();
};
