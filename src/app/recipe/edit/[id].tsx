import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Image,
  StyleSheet,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import { LinearGradient } from "expo-linear-gradient";
import * as ImagePicker from "expo-image-picker";
import { router, useLocalSearchParams } from "expo-router";
import { useAuth } from "context/AuthContext";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface Category {
  _id: string;
  name: string;
  description: string;
}

interface Recipe {
  _id: string;
  name: string;
  imageUrl: string;
  description?: string;
  ingredients?: string[];
  instructions?: string;
  cookTime?: string;
  calories?: number;
  difficulty?: string;
  categories?: { _id: string; name: string; description: string }[];
}

const RecipeEdit = () => {
  const { id } = useLocalSearchParams();
  const { user, isLoading } = useAuth();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [ingredients, setIngredients] = useState<string[]>([""]);
  const [newIngredient, setNewIngredient] = useState("");
  const [instructions, setInstructions] = useState("");
  const [cookTime, setCookTime] = useState("");
  const [calories, setCalories] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const apiUrl = process.env.EXPO_PUBLIC_API_BASE_URL;

  const difficultyOptions = ["Easy", "Medium", "Hard"];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [recipeRes, categoriesRes] = await Promise.all([
          fetch(`${apiUrl}/api/recipes/${id}`, {
            headers: { Authorization: `Bearer ${user?.token}` },
          }),
          fetch(`${apiUrl}/api/recipes/categories`, {
            headers: { Authorization: `Bearer ${user?.token}` },
          }),
        ]);
        if (!recipeRes.ok) throw new Error("Failed to fetch recipe");
        if (!categoriesRes.ok) throw new Error("Failed to fetch categories");

        const recipeData = await recipeRes.json();
        const categoriesData = await categoriesRes.json();
        setRecipe(recipeData);
        setName(recipeData.name || "");
        setDescription(recipeData.description || "");
        setIngredients(recipeData.ingredients || [""]);
        setInstructions(recipeData.instructions || "");
        setCookTime(recipeData.cookTime || "");
        setCalories(recipeData.calories?.toString() || "");
        setDifficulty(recipeData.difficulty || "Easy");
        setSelectedCategory(
          recipeData.categories?.[0]?._id ||
            (categoriesData.length > 0 ? categoriesData[0]._id : null)
        );
        setCategories(categoriesData);
        if (recipeData.imageUrl) setImageUri(recipeData.imageUrl);
      } catch (error) {
        console.error("Error fetching data:", error);
        Alert.alert("Error", "Failed to load data. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchData();
  }, [id, user]);

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
      setIngredients([...ingredients, newIngredient.trim()]);
      setNewIngredient("");
    }
  };

  const handleRemoveIngredient = (index: number) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  const handleUpdate = async () => {
    if (!user || !user.token) {
      Alert.alert("Error", "You need to log in to update a recipe.");
      router.replace("/(auth)/login");
      return;
    }

    if (!name.trim()) {
      Alert.alert("Error", "Recipe name is required.");
      return;
    }
    if (!cookTime.trim()) {
      Alert.alert("Error", "Cook time is required.");
      return;
    }
    if (!instructions.trim()) {
      Alert.alert("Error", "Instructions are required.");
      return;
    }
    if (!calories.trim() || isNaN(Number(calories))) {
      Alert.alert("Error", "Calories must be a valid number.");
      return;
    }
    const validIngredients = ingredients.filter((ing) => ing.trim() !== "");
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
      formData.append("name", name);
      formData.append("description", description || "");
      const normalizedCookTime = /^\d+$/.test(cookTime.trim())
        ? `${cookTime.trim()} mins`
        : cookTime.trim();
      formData.append("cookTime", normalizedCookTime);
      formData.append("difficulty", difficulty);
      formData.append("calories", calories);
      formData.append("ingredients", JSON.stringify(validIngredients));
      formData.append("instructions", instructions);

      const selectedCategoryData = categories.find(
        (cat) => cat._id === selectedCategory
      );
      if (selectedCategoryData) {
        formData.append(
          "categories",
          JSON.stringify([
            {
              _id: selectedCategoryData._id,
              name: selectedCategoryData.name,
              description: selectedCategoryData.description || "",
            },
          ])
        );
      }

      if (imageUri && imageUri.startsWith("file://")) {
        const imageUriParts = imageUri.split(".");
        const fileType = imageUriParts[imageUriParts.length - 1];
        formData.append("image", {
          uri: imageUri,
          name: `recipe.${fileType}`,
          type: `image/${fileType}`,
        } as any);
      } else if (imageUri) {
        formData.append("imageUrl", imageUri);
      }

      const response = await fetch(`${apiUrl}/api/recipes/${id}`, {
        method: "PUT",
        body: formData,
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });

      if (response.ok) {
        router.back();
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
          Alert.alert("Error", errorData.message || "Failed to update recipe.");
        }
      }
    } catch (error) {
      console.error("Update error:", error);
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
          <Text style={styles.loadingText}>Loading data...</Text>
        </LinearGradient>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <LinearGradient colors={["#ff9a56", "#ffad56"]} style={styles.header}>
        <Text style={styles.headerTitle}>Edit Recipe</Text>
        <Text style={styles.headerSubtitle}>
          Update your culinary creation!
        </Text>
      </LinearGradient>

      <View style={styles.formContainer}>
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Recipe Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter recipe name"
            value={name}
            onChangeText={setName}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.multilineInput]}
            placeholder="Enter description"
            value={description}
            onChangeText={setDescription}
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
            value={cookTime}
            onChangeText={setCookTime}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>
            Difficulty (e.g., Easy, Medium, Hard)
          </Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={difficulty}
              style={styles.picker}
              onValueChange={(itemValue) => setDifficulty(itemValue)}
            >
              {difficultyOptions.map((option) => (
                <Picker.Item key={option} label={option} value={option} />
              ))}
            </Picker>
          </View>
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Calories (e.g., 500)</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter calories"
            value={calories}
            onChangeText={setCalories}
            keyboardType="numeric"
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Categories (e.g., Main Dish)</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={selectedCategory}
              style={styles.picker}
              onValueChange={(itemValue) => setSelectedCategory(itemValue)}
            >
              {categories.map((cat) => (
                <Picker.Item key={cat._id} label={cat.name} value={cat._id} />
              ))}
            </Picker>
          </View>
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Ingredients</Text>
          {ingredients.map((ingredient, index) => (
            <View key={index} style={styles.ingredientRow}>
              <TextInput
                style={[styles.input, styles.ingredientInput]}
                placeholder={`Ingredient ${index + 1}`}
                value={ingredient}
                onChangeText={(text) => {
                  const updatedIngredients = [...ingredients];
                  updatedIngredients[index] = text;
                  setIngredients(updatedIngredients);
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
            value={instructions}
            onChangeText={setInstructions}
            multiline
          />
        </View>

        <TouchableOpacity
          style={styles.submitButton}
          onPress={handleUpdate}
          disabled={submitting}
        >
          <LinearGradient
            colors={["#ff9a56", "#ffad56"]}
            style={styles.submitGradient}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.submitText}>Update Recipe</Text>
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

export default RecipeEdit;
