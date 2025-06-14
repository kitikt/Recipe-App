import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Image,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import { LinearGradient } from "expo-linear-gradient";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { useAuth } from "../../context/AuthContext";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface Category {
  _id: string;
  name: string;
  description: string;
}

interface RecipeInput {
  name: string;
  description: string;
  cookTime: string;
  difficulty: string;
  calories: string;
  ingredients: string[];
  instructions: string;
  categoryIds: string[];
}

const PlusScreen = () => {
  const { user, isLoading } = useAuth(); // Sử dụng isLoading từ useAuth
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true); // Giữ lại state loading
  const [submitting, setSubmitting] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [recipe, setRecipe] = useState<RecipeInput>({
    name: "",
    description: "",
    cookTime: "",
    difficulty: "",
    calories: "",
    ingredients: ["1"], // Đặt giá trị mặc định để tránh lỗi
    instructions: "",
    categoryIds: [],
  });
  const [newIngredient, setNewIngredient] = useState("");
  const [imageUri, setImageUri] = useState<string | null>(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch("http://10.0.2.2:8080/api/recipes/categories");
        if (!res.ok) throw new Error("Failed to fetch categories");
        const data = await res.json();
        setCategories(data);
        if (data.length > 0) setSelectedCategory(data[0]._id);
      } catch (error) {
        console.error("Error fetching categories:", error);
        Alert.alert("Error", "Failed to load categories. Please try again.");
      } finally {
        setLoading(false); // Cập nhật loading khi xong
      }
    };
    fetchCategories();
  }, []);

  // Kiểm tra quyền truy cập khi component mount
  useEffect(() => {
    if (!isLoading && (!user || user.role !== "admin")) {
      Alert.alert("Unauthorized", "You must be an admin to add recipes.");
      router.replace("/(tabs)"); // Chuyển về trang tabs
    }
  }, [user, isLoading]);

  const pickImage = async () => {
    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert(
        "Permission Denied",
        "Permission to access media library is required!"
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: "images",
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  const handleAddIngredient = () => {
    if (newIngredient.trim()) {
      setRecipe({
        ...recipe,
        ingredients: [...recipe.ingredients, newIngredient.trim()],
      });
      setNewIngredient("");
    }
  };

  const handleRemoveIngredient = (index: number) => {
    setRecipe({
      ...recipe,
      ingredients: recipe.ingredients.filter((_, i) => i !== index),
    });
  };

  const handleSubmit = async () => {
    if (!user || !user.token) {
      Alert.alert("Error", "You need to log in to add a recipe.");
      router.replace("/(auth)/login");
      return;
    }

    if (!recipe.name.trim()) {
      Alert.alert("Error", "Recipe name is required.");
      return;
    }
    if (!recipe.cookTime.trim()) {
      Alert.alert("Error", "Cook time is required.");
      return;
    }
    if (!recipe.instructions.trim()) {
      Alert.alert("Error", "Instructions are required.");
      return;
    }
    if (!recipe.calories.trim() || isNaN(Number(recipe.calories))) {
      Alert.alert("Error", "Calories must be a valid number.");
      return;
    }
    const validIngredients = recipe.ingredients.filter(
      (ing) => ing.trim() !== ""
    );
    if (validIngredients.length === 0) {
      Alert.alert("Error", "At least one ingredient is required.");
      return;
    }
    if (!selectedCategory) {
      Alert.alert("Error", "Please select a category.");
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("name", recipe.name);
      formData.append("description", recipe.description || "");
      const normalizedCookTime = /^\d+$/.test(recipe.cookTime.trim())
        ? `${recipe.cookTime.trim()} mins`
        : recipe.cookTime.trim();
      formData.append("cookTime", normalizedCookTime);
      formData.append("difficulty", recipe.difficulty || "Easy");
      formData.append("calories", recipe.calories);
      formData.append("ingredients", JSON.stringify(validIngredients));
      formData.append("instructions", recipe.instructions);

      const selectedCategoryData = categories.find(
        (cat) => cat._id === selectedCategory
      );
      if (selectedCategoryData) {
        formData.append(
          "category",
          JSON.stringify({
            _id: selectedCategoryData._id,
            name: selectedCategoryData.name,
            description: selectedCategoryData.description || "",
          })
        );
      }

      if (imageUri) {
        const imageUriParts = imageUri.split(".");
        const fileType = imageUriParts[imageUriParts.length - 1];
        formData.append("image", {
          uri: imageUri,
          name: `recipe.${fileType}`,
          type: `image/${fileType}`,
        } as any);
      }

      console.log("Sending request with token:", user.token);
      const response = await fetch("http://10.0.2.2:8080/api/recipes", {
        method: "POST",
        body: formData,
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });

      if (response.ok) {
        Alert.alert("Success", "Recipe added successfully!", [
          { text: "OK", onPress: () => router.push("/(tabs)") },
        ]);
        setRecipe({
          name: "",
          description: "",
          cookTime: "",
          difficulty: "",
          calories: "",
          ingredients: ["1"],
          instructions: "",
          categoryIds: [],
        });
        setSelectedCategory(categories.length > 0 ? categories[0]._id : null);
        setNewIngredient("");
        setImageUri(null);
      } else {
        const errorData = await response.json();
        console.log("Error response from server:", errorData);
        if (
          errorData.message === "No token provided" ||
          errorData.message.includes("token")
        ) {
          Alert.alert("Error", "Session expired. Please log in again.");
          await AsyncStorage.removeItem("user");
          router.replace("/(auth)/login");
        } else {
          Alert.alert("Error", errorData.message || "Failed to add recipe.");
        }
      }
    } catch (error) {
      console.error("Submit error:", error);
      Alert.alert(
        "Error",
        "Network error. Please check your connection and try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <LinearGradient
          colors={["#ff9a56", "#ffad56"]}
          style={styles.loadingGradient}
        >
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.loadingText}>Loading categories...</Text>
        </LinearGradient>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <LinearGradient colors={["#ff9a56", "#ffad56"]} style={styles.header}>
        <Text style={styles.headerTitle}>Add New Recipe</Text>
        <Text style={styles.headerSubtitle}>
          Share your culinary creation with the world!
        </Text>
      </LinearGradient>

      <View style={styles.formContainer}>
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Recipe Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter recipe name"
            value={recipe.name}
            onChangeText={(text) => setRecipe({ ...recipe, name: text })}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.multilineInput]}
            placeholder="Enter description"
            value={recipe.description}
            onChangeText={(text) => setRecipe({ ...recipe, description: text })}
            multiline
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Recipe Image (optional)</Text>
          <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
            <Feather name="image" size={24} color="#ff9a56" />
            <Text style={styles.imagePickerText}>Select Image</Text>
          </TouchableOpacity>
          {imageUri && (
            <Image source={{ uri: imageUri }} style={styles.imagePreview} />
          )}
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Cook Time (e.g., 30 mins)</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter cook time"
            value={recipe.cookTime}
            onChangeText={(text) => setRecipe({ ...recipe, cookTime: text })}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Difficulty (e.g., Easy)</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter difficulty"
            value={recipe.difficulty}
            onChangeText={(text) => setRecipe({ ...recipe, difficulty: text })}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Calories (e.g., 500)</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter calories"
            value={recipe.calories}
            onChangeText={(text) => setRecipe({ ...recipe, calories: text })}
            keyboardType="numeric"
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Categories</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={selectedCategory}
              style={styles.picker}
              onValueChange={(itemValue) => setSelectedCategory(itemValue)}
            >
              {categories.map((category) => (
                <Picker.Item
                  key={category._id}
                  label={category.name}
                  value={category._id}
                />
              ))}
            </Picker>
          </View>
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Ingredients</Text>
          {recipe.ingredients.map((ingredient, index) => (
            <View key={index} style={styles.ingredientRow}>
              <TextInput
                style={[styles.input, styles.ingredientInput]}
                placeholder={`Ingredient ${index + 1}`}
                value={ingredient}
                onChangeText={(text) => {
                  const updatedIngredients = [...recipe.ingredients];
                  updatedIngredients[index] = text;
                  setRecipe({ ...recipe, ingredients: updatedIngredients });
                }}
              />
              {index > 0 && (
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => handleRemoveIngredient(index)}
                >
                  <Feather name="x" size={20} color="#ff4757" />
                </TouchableOpacity>
              )}
            </View>
          ))}
          <View style={styles.ingredientRow}>
            <TextInput
              style={[styles.input, styles.ingredientInput]}
              placeholder="Add new ingredient"
              value={newIngredient}
              onChangeText={setNewIngredient}
            />
            <TouchableOpacity
              style={styles.addButton}
              onPress={handleAddIngredient}
            >
              <Feather name="plus" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Instructions</Text>
          <TextInput
            style={[styles.input, styles.multilineInput]}
            placeholder="Enter instructions"
            value={recipe.instructions}
            onChangeText={(text) =>
              setRecipe({ ...recipe, instructions: text })
            }
            multiline
          />
        </View>

        <TouchableOpacity
          style={styles.submitButton}
          onPress={handleSubmit}
          disabled={submitting}
        >
          <LinearGradient
            colors={["#ff9a56", "#ffad56"]}
            style={styles.submitGradient}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.submitText}>Add Recipe</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  loadingGradient: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 18,
    color: "#fff",
    fontWeight: "600",
    textAlign: "center",
  },
  header: {
    padding: 20,
    paddingTop: 50,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
  },
  headerSubtitle: {
    fontSize: 16,
    color: "rgba(255,255,255,0.9)",
    marginTop: 5,
  },
  formContainer: {
    padding: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 12,
    fontSize: 16,
    color: "#333",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  multilineInput: {
    minHeight: 100,
    textAlignVertical: "top",
  },
  imagePicker: {
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 12,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 10,
  },
  imagePickerText: {
    color: "#ff9a56",
    fontSize: 16,
    fontWeight: "600",
    marginTop: 5,
  },
  imagePreview: {
    width: "100%",
    height: 150,
    borderRadius: 15,
    marginTop: 10,
  },
  pickerContainer: {
    backgroundColor: "#fff",
    borderRadius: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  picker: {
    height: 50,
    width: "100%",
  },
  ingredientRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  ingredientInput: {
    flex: 1,
  },
  addButton: {
    backgroundColor: "#ff9a56",
    borderRadius: 15,
    padding: 10,
    marginLeft: 10,
  },
  removeButton: {
    padding: 10,
    marginLeft: 10,
  },
  submitButton: {
    marginTop: 10,
    borderRadius: 15,
    overflow: "hidden",
  },
  submitGradient: {
    padding: 15,
    alignItems: "center",
  },
  submitText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
  },
});

export default PlusScreen;
