import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
  TextInput,
  ScrollView,
} from "react-native";
import Feather from "@expo/vector-icons/Feather";
import { router, useFocusEffect } from "expo-router";

// Define interfaces for data
interface Category {
  name: string;
  description: string;
  _id: string;
}

interface Recipe {
  _id: string;
  name: string;
  imageUrl: string;
  cookTime?: string;
  difficulty?: string;
  calories?: string;
  categories: Category[];
}

// Component to display recipe card (unchanged)
const RecipeCard = ({
  item,
  showDetails = false,
  onPress,
}: {
  item: Recipe;
  showDetails?: boolean;
  onPress: () => void;
}) => {
  return (
    <TouchableOpacity style={styles.recipeCard} onPress={onPress}>
      <Image source={{ uri: item.imageUrl }} style={styles.recipeImage} />
      <View style={styles.cardContent}>
        <Text style={styles.recipeTitle} numberOfLines={2}>
          {item.name}
        </Text>
        {showDetails && (
          <View style={styles.recipeDetails}>
            {item.cookTime && (
              <Text style={styles.detailText}>
                <Feather name="clock" size={12} color="#ff8c00" />{" "}
                {item.cookTime}
              </Text>
            )}
            {item.difficulty && (
              <Text style={styles.detailText}>
                <Feather name="trending-up" size={12} color="#4ecdc4" />{" "}
                {item.difficulty}
              </Text>
            )}
          </View>
        )}
        {item.calories && (
          <Text style={styles.caloriesText}>{item.calories} Kcal</Text>
        )}
      </View>
    </TouchableOpacity>
  );
};

const Home = () => {
  const [activeCategory, setActiveCategory] = useState("All");
  const [needToTryRecipes, setNeedToTryRecipes] = useState<Recipe[]>([]);
  const [popularRecipes, setPopularRecipes] = useState<Recipe[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const apiUrl = process.env.EXPO_PUBLIC_API_BASE_URL;
  useFocusEffect(
    React.useCallback(() => {
      const fetchData = async () => {
        try {
          setLoading(true);
          setError(null);

          const [categoriesRes, recipesRes] = await Promise.all([
            fetch(`${apiUrl}/api/recipes/categories`),
            fetch(`${apiUrl}/api/recipes`),
          ]);

          const categoriesData = await categoriesRes.json();
          setCategories([
            "All",
            ...categoriesData.map((cat: Category) => cat.name),
          ]);

          const recipesData = await recipesRes.json();
          setNeedToTryRecipes(recipesData);
          setPopularRecipes(recipesData);

          if (!recipesData || recipesData.length === 0) {
            setError("Không có công thức nào để hiển thị.");
          }
        } catch (error) {
          console.error("Fetch data error:", error);
          setError("Lỗi khi tải dữ liệu. Vui lòng thử lại sau.");
        } finally {
          setLoading(false);
        }
      };

      fetchData();
    }, [])
  );

  React.useEffect(() => {
    if (categories.length > 0 && !categories.includes(activeCategory)) {
      setActiveCategory("All");
    }
  }, [categories, activeCategory]);

  const handleCategoryPress = (category: string) => {
    setActiveCategory(category);
  };

  const handleRecipePress = (recipeId: string) => {
    router.push({
      pathname: "/recipe/[id]",
      params: { id: recipeId },
    });
  };

  const filterRecipes = (
    recipes: Recipe[],
    category: string,
    query: string
  ) => {
    return recipes.filter((recipe) => {
      const matchesCategory =
        category === "All" ||
        recipe.categories?.some((c) => c.name === category);
      const matchesSearch =
        query === "" || recipe.name.toLowerCase().includes(query.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  };

  const filteredNeedToTryRecipes = filterRecipes(
    needToTryRecipes,
    activeCategory,
    searchQuery
  );
  const filteredPopularRecipes = filterRecipes(
    popularRecipes,
    activeCategory,
    searchQuery
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#ff8c00" />
        <Text style={styles.loadingText}>Loading recipes...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Digital Cookbook</Text>
        <Text style={styles.greeting}>Hello User 👋</Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Feather
          name="search"
          size={20}
          color="#999"
          style={styles.searchIcon}
        />
        <TextInput
          placeholder="Search recipes..."
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery("")}>
            <Feather name="x" size={20} color="#999" />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoriesContainer}
      >
        {categories.map((category) => (
          <TouchableOpacity
            key={category}
            style={styles.categoryButton}
            onPress={() => handleCategoryPress(category)}
          >
            <View
              style={[
                styles.categoryImageContainer,
                activeCategory === category &&
                  styles.activeCategoryImageContainer,
              ]}
            >
              <Image
                source={getCategoryImage(category)}
                style={styles.categoryImage}
              />
            </View>
            <Text
              style={[
                styles.categoryText,
                activeCategory === category && styles.activeCategoryText,
              ]}
            >
              {category}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      {/* Need to Try Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Need to Try</Text>
        {searchQuery === "" && filteredNeedToTryRecipes.length === 0 ? (
          <Text style={styles.noResultsText}>
            No recipes available. Try another category.
          </Text>
        ) : (
          <FlatList
            horizontal
            data={filteredNeedToTryRecipes}
            keyExtractor={(item) => item._id}
            renderItem={({ item }) => (
              <RecipeCard
                item={item}
                showDetails
                onPress={() => handleRecipePress(item._id)}
              />
            )}
            showsHorizontalScrollIndicator={false}
            ListEmptyComponent={
              searchQuery !== "" ? (
                <Text style={styles.noResultsText}>
                  No recipes found for "{searchQuery}".
                </Text>
              ) : null
            }
          />
        )}
      </View>

      {/* Today's Tip */}
      <View style={styles.tipContainer}>
        <Text style={styles.tipTitle}>💡 Today's Tip</Text>
        <Text style={styles.tipText}>
          Drink water 30 minutes before meals to reduce calorie intake.
        </Text>
      </View>

      {/* Popular Recipes Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Popular Recipes</Text>
        {searchQuery === "" && filteredPopularRecipes.length === 0 ? (
          <Text style={styles.noResultsText}>
            No popular recipes available. Try another category.
          </Text>
        ) : (
          <FlatList
            horizontal
            data={filteredPopularRecipes}
            keyExtractor={(item) => item._id}
            renderItem={({ item }) => (
              <RecipeCard
                item={item}
                onPress={() => handleRecipePress(item._id)}
              />
            )}
            showsHorizontalScrollIndicator={false}
            ListEmptyComponent={
              searchQuery !== "" ? (
                <Text style={styles.noResultsText}>
                  No popular recipes found for "{searchQuery}".
                </Text>
              ) : null
            }
          />
        )}
      </View>
    </ScrollView>
  );
};

// Helper function to get category image based on category name
const getCategoryImage = (category: string) => {
  const images = {
    All: require("../../assets/images/waiter.png"),
    Lunch: require("../../assets/images/ramen.png"),
    Dinner: require("../../assets/images/christmas-dinner.png"),
    Dessert: require("../../assets/images/cake.png"),
    Breakfast: require("../../assets/images/breakfast.png"),
  };
  return (
    images[category as keyof typeof images] || {
      uri: "https://example.com/default_icon.png",
    }
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#666",
  },
  header: {
    marginTop: 50,
    padding: 20,
    backgroundColor: "#BC8F8F",
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "white",
  },
  greeting: {
    fontSize: 16,
    color: "white",
    marginTop: 5,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 20,
    margin: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#333",
  },
  categoriesContainer: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  categoryButton: {
    alignItems: "center",
    marginRight: 20,
  },
  categoryImageContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#F5F5F5", // Nền xám nhạt mặc định
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  activeCategoryImageContainer: {
    backgroundColor: "#F7E7CE", // Nền nhạt cho danh mục đang chọn
    borderWidth: 2,
    borderColor: "#F7E7CE", // Viền cam cho hiệu ứng active
  },
  categoryImage: {
    width: 35,
    height: 35,
  },
  categoryText: {
    fontSize: 12,
    color: "#666", // Chữ xám mặc định
    textAlign: "center",
  },
  activeCategoryText: {
    color: "#964B00", // Chữ cam khi active
    fontWeight: "600", // In đậm khi active
  },

  section: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
  },
  recipeCard: {
    width: 200,
    marginRight: 15,
    borderRadius: 15,
    backgroundColor: "white",
    position: "relative",
  },
  recipeImage: {
    width: "100%",
    height: 120,
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
  },
  cardContent: {
    padding: 10,
  },
  recipeTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  recipeDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 5,
  },
  detailText: {
    fontSize: 12,
    color: "#666",
  },
  caloriesText: {
    fontSize: 12,
    color: "#ff8c00",
  },
  tipContainer: {
    backgroundColor: "white",
    borderRadius: 15,
    padding: 15,
    marginHorizontal: 20,
    marginBottom: 20,
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#ff8c00",
    marginBottom: 5,
  },
  tipText: {
    fontSize: 14,
    color: "#666",
  },
  noResultsText: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
    marginVertical: 10,
  },
});

export default Home;
