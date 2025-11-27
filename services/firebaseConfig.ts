
import { initializeApp, getApps, getApp, deleteApp, FirebaseApp } from "firebase/app";
import { getDatabase, Database, ref, set, remove } from "firebase/database";

// Default configuration for La Perla POS
export const DEFAULT_CONFIG = {
  apiKey: "AIzaSyDVOEQU32xNJpgAoQHnBydiq8sGD5zHh-0",
  authDomain: "laperlapos.firebaseapp.com",
  databaseURL: "https://laperlapos-default-rtdb.firebaseio.com",
  projectId: "laperlapos",
  storageBucket: "laperlapos.firebasestorage.app",
  messagingSenderId: "23857322416",
  appId: "1:23857322416:web:d21028b250bf715c171e75",
  measurementId: "G-P7V1R36M27"
};

// Try to load from Local Storage (for dynamic setup without code edits)
const getStoredConfig = () => {
    try {
        const stored = localStorage.getItem('la_perla_firebase_settings');
        if (stored) return JSON.parse(stored);
    } catch (e) {
        console.error("Failed to parse stored config", e);
    }
    return null;
};

const userConfig = getStoredConfig();
// Use user config if available, otherwise default
const firebaseConfig = userConfig || DEFAULT_CONFIG;

// Singleton pattern to prevent multiple initializations
let app: FirebaseApp | undefined;
let dbInstance: Database | null = null;

try {
    if (!getApps().length) {
        app = initializeApp(firebaseConfig);
    } else {
        app = getApp();
    }
    
    // Attempt to get database instance. This might fail if config is malformed (e.g. bad URL)
    try {
        dbInstance = getDatabase(app);
    } catch (dbError) {
        console.warn("Firebase Database init failed (likely bad config URL):", dbError);
        dbInstance = null;
    }

} catch (e) {
    console.error("Firebase App Initialization Error:", e);
    // Do NOT fallback to default here, as it might just cause another crash down the line.
    // Let dbInstance remain null so the app can handle "no connection" gracefully.
}

export const db = dbInstance;

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
    
    // If using default config (laperlapos), it IS configured.
    return firebaseConfig.projectId === "laperlapos";
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
        const tempDb = getDatabase(tempApp);
        const testRef = ref(tempDb, '_connection_test');
        
        // Try to write
        await set(testRef, { status: 'ok', time: Date.now() });
        // Try to delete (cleanup)
        await remove(testRef);

        return { success: true };
    } catch (e: any) {
        console.error("Test Connection Error:", e);
        let msg = e.message;
        if (e.code === 'PERMISSION_DENIED') {
            msg = "PERMISSION_DENIED: Database rules prevent writing. Please go to Firebase Console -> Build -> Realtime Database -> Rules and set read/write to true.";
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
        console.error("Config Save Error", e);
        return { success: false, error: e.message || "Unknown error." };
    }
};

export const clearFirebaseConfigLocally = () => {
    localStorage.removeItem('la_perla_firebase_settings');
    window.location.reload();
};
