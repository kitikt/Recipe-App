import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
  TextInput,
} from "react-native";
import Feather from "@expo/vector-icons/Feather";
import { useNavigation } from "@react-navigation/native";

interface Category {
  name: string;
  description: string;
  _id: string;
}

interface Recipe {
  _id: string;
  name: string;
  imageUrl: string;
  time?: string;
  difficulty?: string;
  calories?: string;
  categories: Category[];
  __v?: number;
}
const Home = () => {
  const [activeCategory, setActiveCategory] = useState("All");
  const [needToTryRecipes, setNeedToTryRecipes] = useState<Recipe[]>([]);
  const [popularRecipes, setPopularRecipes] = useState<Recipe[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const navigation = useNavigation();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [categoriesRes, needRes, popularRes] = await Promise.all([
          fetch("http://10.0.2.2:8080/api/recipes/categories"),
          fetch("http://10.0.2.2:8080/api/recipes"),
          fetch("http://10.0.2.2:8080/api/recipes"),
        ]);

        const categoriesData = await categoriesRes.json();
        const needData = await needRes.json();
        const popularData = await popularRes.json();

        const categoryNames = categoriesData.map(
          (category: Category) => category.name
        );
        setCategories(["All", ...categoryNames]);
        setNeedToTryRecipes(needData);
        setPopularRecipes(popularData);
      } catch (error) {
        if (error instanceof Error) {
          console.error("Fetch error:", error.message);
        } else {
          console.error("Fetch error:", error);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleCategoryPress = (category: string) => {
    setActiveCategory(category);
  };

  const handleRecipePress = (recipeId: string) => {
    // navigation.navigate("RecipeDetail", { recipeId });
  };
  const filteredNeedToTryRecipes =
    activeCategory === "All"
      ? needToTryRecipes
      : needToTryRecipes.filter((recipe) =>
          recipe.categories.some((category) => category.name === activeCategory)
        );

  const filteredPopularRecipes =
    activeCategory === "All"
      ? popularRecipes
      : popularRecipes.filter((recipe) =>
          recipe.categories.some((category) => category.name === activeCategory)
        );
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#fa8c16" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Your Personal Digital Cookbook</Text>
      <Text style={styles.greetingUser}>Hello User</Text>
      <View style={styles.searchContainer}>
        <TextInput placeholder="Search recipes..." style={styles.searchInput} />
        <Feather
          name="search"
          size={24}
          color="black"
          style={styles.searchIcon}
        />
      </View>
      <View style={styles.categories}>
        {categories.map((category) => (
          <TouchableOpacity
            key={category}
            style={[
              styles.categoryButton,
              activeCategory === category && styles.activeCategory,
            ]}
            onPress={() => handleCategoryPress(category)}
          >
            <Text style={styles.categoryText}>{category}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.sectionTitle}>Need to try</Text>
      <FlatList
        horizontal
        data={filteredNeedToTryRecipes}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.recipeCard}
            onPress={() => handleRecipePress(item._id)}
          >
            <Image source={{ uri: item.imageUrl }} style={styles.recipeImage} />
            <Text style={styles.recipeTitle}>{item.name}</Text>
            <View style={styles.recipeDetails}>
              <Text style={styles.detailText}>{item.time}</Text>
              <Text style={styles.detailText}>{item.difficulty}</Text>
              <Text style={styles.detailText}>{item.calories}</Text>
            </View>
          </TouchableOpacity>
        )}
        showsHorizontalScrollIndicator={false}
      />

      <View style={styles.tipContainer}>
        <Text style={styles.tipTitle}>💡 Today’s Tip</Text>
        <Text style={styles.tipText}>
          Drink a glass of water 30 minutes before your meal – it may help
          reduce calorie intake and boost metabolism.
        </Text>
      </View>

      <Text style={styles.sectionTitle}>Popular recipes</Text>
      <FlatList
        horizontal
        data={popularRecipes}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.recipeCard}
            onPress={() => handleRecipePress(item._id)}
          >
            <Image source={{ uri: item.imageUrl }} style={styles.recipeImage} />
            <Text style={styles.recipeTitle}>{item.name}</Text>
            <Text style={styles.detailText}>{item.calories}</Text>
          </TouchableOpacity>
        )}
        showsHorizontalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    marginTop: 60,
    padding: 10,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 10,
  },
  greetingUser: {
    margin: 10,
    color: "black",
  },
  categories: {
    flexDirection: "row",
    marginBottom: 20,
  },
  categoryButton: {
    padding: 10,
    marginRight: 15,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#ccc",
  },
  activeCategory: {
    backgroundColor: "#faebd7",
  },
  categoryText: {
    fontSize: 14,
    color: "#333",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  recipeCard: {
    width: 200,
    height: 200,
    marginRight: 10,
    borderRadius: 15,
    backgroundColor: "#f5f5f5",
    overflow: "hidden",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  recipeImage: {
    width: "100%",
    height: 140,
    resizeMode: "cover",
  },
  recipeTitle: {
    fontSize: 14,
    fontWeight: "bold",
    marginVertical: 5,
    paddingHorizontal: 5,
  },
  recipeDetails: {
    flexDirection: "row",
    justifyContent: "center",
    position: "absolute",
    bottom: 10,
    width: "100%",
  },
  detailText: {
    fontSize: 12,
    color: "#666",
    marginHorizontal: 5,
  },
  tipContainer: {
    backgroundColor: "#fff3e0",
    borderRadius: 12,
    padding: 15,
    marginVertical: 10,
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 5,
    color: "#ff8c00",
  },
  tipText: {
    fontSize: 14,
    color: "#333",
    lineHeight: 20,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderColor: "#ccc",
    backgroundColor: "#E6E6E6",
    borderWidth: 1,
    borderRadius: 20,
    marginBottom: 15,
    position: "relative",
  },
  searchInput: {
    height: 45,
    flex: 1,
    paddingHorizontal: 10,
    paddingLeft: 10,
  },
  searchIcon: {
    borderWidth: 5,
    borderColor: "white",
    backgroundColor: "white",
    borderRadius: 20,
    marginLeft: 10,
    marginRight: 8,
  },
});

export default Home;
