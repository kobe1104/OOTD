import { useState } from "react";
import { View, Text, TextInput, Button, StyleSheet } from "react-native";
import { useAuth } from "../src/context/AuthContext";
import { useRouter } from "expo-router";

const SignupScreen = () => {
  const { register } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");  // ✅ Added username field
  const [error, setError] = useState("");

  const handleSignup = async () => {
    setError("");

    if (!username.trim()) {
      setError("Username is required!");
      return;
    }

    try {
      await register(email, password, username.trim());  // ✅ Ensure username is passed
      console.log("Signup successful, redirecting to login...");
      router.push("/login");
    } catch (error) {
      setError(error.message);
      console.error("Signup failed:", error.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sign Up</Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      
      <TextInput 
        style={styles.input} 
        placeholder="Username" 
        onChangeText={setUsername} 
        value={username} 
      />
      
      <TextInput 
        style={styles.input} 
        placeholder="Email" 
        onChangeText={setEmail} 
        value={email} 
        autoCapitalize="none" 
      />
      
      <TextInput 
        style={styles.input} 
        placeholder="Password" 
        secureTextEntry 
        onChangeText={setPassword} 
        value={password} 
      />
      
      <Button title="Sign Up" onPress={handleSignup} />
      <Button title="Go to Login" onPress={() => router.push("/login")} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", padding: 20 },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 20 },
  input: { width: "100%", height: 40, borderWidth: 1, borderColor: "#ccc", borderRadius: 5, paddingHorizontal: 10, marginBottom: 10 },
  error: { color: "red", marginBottom: 10 },
});

export default SignupScreen;
