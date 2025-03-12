import { useState, useEffect } from "react";
import { View, Text, TextInput, Button, Image, StyleSheet } from "react-native";
import { useAuth } from "../src/context/AuthContext";
import { db, storage, auth } from "../src/firebase/firebaseConfig";
import {ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { Platform } from "react-native";
import * as FileSystem from "expo-file-system";
import mime from "mime";

const ProfileScreen = () => {
  const { user, setUser } = useAuth();
  const router = useRouter();
  const [username, setUsername] = useState(user?.username || "");
  const [profilePic, setProfilePic] = useState(user?.profilePic || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // ✅ Fetch the latest user data from Firestore
  useEffect(() => {

    const fetchUserData = async () => {
      if (!user?.uid) return;

      try {
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const data = userSnap.data();
          setUsername(data.username);
          setProfilePic(data.profilePic || null);
        }
      } catch (error) {
        console.error("Error fetching user data:", error.message);
      }
    };

    fetchUserData();
  }, [user]);

  const pickImage = async () => {
    console.log('pick image');
    try {
        let result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,  // ✅ Correct format
          allowsEditing: true,
          aspect: [1, 1],
          quality: 1,
        });
    
        console.log("📸 Image Picker Result:", result); // ✅ Debugging log
    
        if (!result.canceled && result.assets.length > 0) {
          const selectedUri = result.assets[0].uri;
          console.log("✅ Selected Image URI:", selectedUri);
          setProfilePic(selectedUri);
          uploadImage(selectedUri);
        } else {
          console.warn("⚠️ No image was selected!");
        }
      } catch (error) {
        console.error("❌ Error selecting image:", error.message);
      }
  };

  // ✅ Upload Profile Picture to Firebase Storage
  const handleUploadProfilePic = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      alert("Permission to access gallery is required!");
      return;
    }
   
    await pickImage();
  };

  // ✅ Upload Image to Firebase Storage and Update Firestore
  const uploadImage = async (imageUri) => {
    setLoading(true);
    setError("");
  
    try {
      console.log("📸 Upload function started with imageUri:", imageUri);
  
      let blob;
  
      if (Platform.OS === "web") {
        console.log("🌐 Running on Web, using fetch to get Blob...");
        const response = await fetch(imageUri);
        blob = await response.blob();
      } else {
        console.log("📱 Running on iOS/Android, using FileSystem to get Base64...");
  
        const fileUri = imageUri.replace("file://", ""); // Remove 'file://'
        const base64Data = await FileSystem.readAsStringAsync(fileUri, {
          encoding: FileSystem.EncodingType.Base64,
        });
  
        blob = await convertBase64ToBlob(base64Data); // ✅ Use the new conversion function
        // ✅ Get file extension dynamically using MIME type
        const mimeType = mime.getType(fileUri) || "image/jpeg";
        fileExtension = mime.getExtension(mimeType) || "jpg";

        console.log(`📝 Detected MIME type: ${mimeType}, Extension: ${fileExtension}`);
      }
  
      if (!blob || blob.size === 0) {
        throw new Error("Invalid Blob: Blob is empty or undefined.");
      }
  
      console.log("✅ Blob created, preparing to upload...");
  
      // ✅ Use dynamic extension instead of forcing ".jpg"
      const imageRef = ref(storage, `profilePictures/${user.uid}/profile.${fileExtension}`);
      const uploadTask = uploadBytesResumable(imageRef, blob);
  
      uploadTask.on(
        "state_changed",
        (snapshot) => {
          console.log(`📶 Upload progress: ${(snapshot.bytesTransferred / snapshot.totalBytes) * 100}%`);
        },
        async (error) => {
          console.error("❌ Upload failed:", error.message, "🔥 Full error:", error);
          alert(`❌ Upload failed: ${error.message}`);
          setError(`Upload failed: ${error.message}`);
        },
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          console.log("✅ Upload successful! Download URL:", downloadURL);

          await updateDoc(doc(db, "users", user.uid), { profilePic: downloadURL });
  
          setUser((prevUser) => ({ ...prevUser, profilePic: downloadURL }));
          alert("🎉 Profile picture updated successfully!");
        }
      );
    } catch (error) {
      console.error("❌ Upload error:", error.message, "🔥 Full error:", error);
      alert(`❌ Upload error: ${error.message}`);
      setError(`Failed to upload image: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // test
  const uploadTestFile = async () => {
    try {
      console.log("📸 Upload function started with test data...");
  
      // ✅ Ensure user is authenticated
      if (!auth.currentUser) {
        console.log("⚠️ No authenticated user found!");
        return;
      }
      console.log("✅ Authenticated user:", auth.currentUser.uid);
  
      const blob = new Blob(["This is a test file for Firebase Storage."], { type: "text/plain" });
      console.log("✅ Test Blob created, preparing to upload...");
  
      const testFileRef = ref(storage, `test_upload_${auth.currentUser.uid}.txt`);
      console.log("🚀 Uploading to Firebase Path:", testFileRef.fullPath);
  
      const uploadTask = uploadBytesResumable(testFileRef, blob);
  
      uploadTask.on(
        "state_changed",
        (snapshot) => {
          console.log(`📶 Upload progress: ${(snapshot.bytesTransferred / snapshot.totalBytes) * 100}%`);
        },
        async (error) => {
          console.error("❌ Upload failed:", error.code, "🔥 Full error:", error);
        },
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          console.log("✅ Upload successful! Download URL:", downloadURL);
        }
      );
    } catch (error) {
      console.error("❌ Upload error:", error.message, "🔥 Full error:", error);
    }
  };
  

// ✅ Helper function: Convert Base64 to Blob
const convertBase64ToBlob = async (base64) => {
    console.log("🔄 Converting Base64 to Blob using fetch...");
  
    try {
      // ✅ Convert Base64 into a Data URL
      const base64DataUrl = `data:image/jpeg;base64,${base64}`;
  
      // ✅ Use fetch to convert Data URL into a Blob
      const response = await fetch(base64DataUrl);
      const blob = await response.blob();
  
      console.log("✅ Successfully converted Base64 to Blob!");
      return blob;
    } catch (error) {
      console.error("❌ Blob conversion failed:", error.message);
      throw new Error("Blob conversion failed: " + error.message);
    }
  };
  
  


  return (
    <View style={styles.container}>
      <Text style={styles.title}>Profile</Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}

      {profilePic ? (
        <Image source={{ uri: profilePic }} style={styles.profileImage} />
      ) : (
        <Text>No Profile Picture</Text>
      )}

      <Button title="Upload Profile Picture" onPress={pickImage} disabled={loading} />

      <Button title="Test Upload" onPress={uploadTestFile} />

      <Text style={styles.label}>Email:</Text>
      <Text style={styles.info}>{user?.email || "N/A"}</Text>

      <Text style={styles.label}>Username:</Text>
      <TextInput
        style={styles.input}
        value={username}
        onChangeText={setUsername}
      />

      <Button title="Go Back" onPress={() => router.push("/home")} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", padding: 20 },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 20 },
  profileImage: { width: 100, height: 100, borderRadius: 50, marginBottom: 10 },
  label: { fontSize: 18, fontWeight: "bold", marginTop: 10 },
  info: { fontSize: 16, marginBottom: 10 },
  input: { width: "80%", height: 40, borderWidth: 1, borderColor: "#ccc", borderRadius: 5, paddingHorizontal: 10, marginBottom: 10 },
  error: { color: "red", marginBottom: 10 },
});

export default ProfileScreen;
