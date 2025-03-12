import { createContext, useContext, useState, useEffect } from "react";
import { auth, db, storage } from "../firebase/firebaseConfig";
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut 
} from "firebase/auth";
import { setDoc, doc, getDoc } from "firebase/firestore"; 

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchUserData = async (uid) => {
    const userDoc = await getDoc(doc(db, "users", uid));
    if (userDoc.exists()) {
      setUser({
        uid,
        email: auth.currentUser.email,  // ✅ Email comes from Firebase Auth
        username: userDoc.data().username,
        profilePic: userDoc.data().profilePic || null, // ✅ Ensure profilePic is set
      });
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Function to log in users (missing in your file)
  const login = (email, password) => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  // Function to register new users
  // const register = (email, password) => {
  //   return createUserWithEmailAndPassword(auth, email, password);
  // };
  const register = async (email, password, username) => {
    try {
      if (!username.trim()) throw new Error("Username is required!");
  
      console.log("Starting registration for:", email);
  
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
  
      console.log("User created successfully:", user.uid);
  
      // Save user data in Firestore
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        email: user.email,
        username: username,
        createdAt: new Date().toISOString()
      });
  
      console.log("User data saved in Firestore:", { uid: user.uid, email: user.email, username });
  
      setUser({ uid: user.uid, email: user.email, username });
  
    } catch (error) {
      console.error("Registration failed:", error.message);
      throw error; // Re-throw so we can handle it in the UI
    }
  };

  // Function to log out users
  const logout = async () => {
    await signOut(auth);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook for accessing AuthContext
export const useAuth = () => useContext(AuthContext);
