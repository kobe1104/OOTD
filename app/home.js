import { View, Text, Button, StyleSheet } from "react-native";
import { useAuth } from "../src/context/AuthContext";
import { useRouter } from "expo-router";

const HomeScreen = () => {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome, {user?.username || "Guest"}!</Text>
      <Text style={styles.info}>Email: {user?.email || "N/A"}</Text>
      <Text style={styles.info}>User ID: {user?.uid || "N/A"}</Text>

      <Button title="Go to Profile" onPress={() => router.push("/profile")} />
      <Button title="Logout" onPress={handleLogout} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", padding: 20 },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 10 },
  info: { fontSize: 16, marginBottom: 5 },
});

export default HomeScreen;
