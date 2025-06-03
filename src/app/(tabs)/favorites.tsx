import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  Image,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router, useFocusEffect } from "expo-router";
import { useCallback } from "react";

interface FavoriteRecipe {
  _id: string;
  name: string;
  imageUrl: string;
  cookTime?: string;
  difficulty?: string;
  calories?: string;
  categories: string[];
}

const FavoritesScreen = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [favoriteRecipes, setFavoriteRecipes] = useState<FavoriteRecipe[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFavorites = useCallback(async () => {
    try {
      setLoading(true);
      const storedFavorites = await AsyncStorage.getItem("likedRecipes");
      const favoriteIds: string[] = storedFavorites
        ? JSON.parse(storedFavorites)
        : [];

      if (favoriteIds.length === 0) {
        setFavoriteRecipes([]);
        setLoading(false);
        return;
      }

      const recipePromises = favoriteIds.map((id: string) =>
        fetch(`http://10.0.2.2:8080/api/recipes/${id}`).then((res) => {
          if (!res.ok) {
            throw new Error(`Failed to fetch recipe with ID ${id}`);
          }
          return res.json();
        })
      );

      const recipes = await Promise.all(recipePromises);
      setFavoriteRecipes(
        recipes.map((recipe: any) => ({
          _id: recipe._id,
          name: recipe.name,
          imageUrl: recipe.imageUrl,
          cookTime: recipe.cookTime,
          difficulty: recipe.difficulty,
          calories: recipe.calories,
          categories:
            recipe.categories?.map((cat: any) =>
              typeof cat === "string" ? cat : cat.name
            ) || [],
        }))
      );
    } catch (error) {
      console.error("Error fetching favorite recipes:", error);
      setFavoriteRecipes([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchFavorites();
    }, [fetchFavorites])
  );

  const removeFavorite = async (recipeId: string) => {
    try {
      setFavoriteRecipes((prev) =>
        prev.filter((recipe) => recipe._id !== recipeId)
      );
      const storedFavorites = await AsyncStorage.getItem("likedRecipes");
      const favoriteIds: string[] = storedFavorites
        ? JSON.parse(storedFavorites)
        : [];
      const updatedFavorites = favoriteIds.filter((id) => id !== recipeId);
      await AsyncStorage.setItem(
        "likedRecipes",
        JSON.stringify(updatedFavorites)
      );
    } catch (error) {
      console.error("Error removing favorite:", error);
    }
  };

  const filteredRecipes = favoriteRecipes.filter((recipe) =>
    recipe.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const FavoriteCard = ({ item }: { item: FavoriteRecipe }) => (
    <TouchableOpacity
      style={styles.recipeCard}
      onPress={() =>
        router.push({ pathname: "/recipe/[id]", params: { id: item._id } })
      }
    >
      <Image source={{ uri: item.imageUrl }} style={styles.recipeImage} />
      <TouchableOpacity
        style={styles.favoriteButton}
        onPress={() => removeFavorite(item._id)}
      >
        <Feather name="heart" size={18} color="#ff4757" fill="#ff4757" />
      </TouchableOpacity>

      <View style={styles.cardContent}>
        <Text style={styles.recipeTitle} numberOfLines={2}>
          {item.name}
        </Text>

        <View style={styles.recipeDetails}>
          {item.cookTime && (
            <View style={styles.detailItem}>
              <Feather name="clock" size={12} color="#ff8c00" />
              <Text style={styles.detailText}>{item.cookTime}</Text>
            </View>
          )}
          {item.difficulty && (
            <View style={styles.detailItem}>
              <Feather name="trending-up" size={12} color="#4ecdc4" />
              <Text style={styles.detailText}>{item.difficulty}</Text>
            </View>
          )}
        </View>

        {item.calories && (
          <Text style={styles.caloriesText}>{item.calories} Kcal</Text>
        )}

        <View style={styles.categoriesContainer}>
          {item.categories.slice(0, 2).map((category, index) => (
            <View key={index} style={styles.categoryTag}>
              <Text style={styles.categoryTagText}>{category}</Text>
            </View>
          ))}
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#ff4757" />
        <Text style={styles.loadingText}>Loading favorites...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Your Favorites</Text>
        <Text style={styles.subtitle}>
          {favoriteRecipes.length} saved recipe
          {favoriteRecipes.length !== 1 ? "s" : ""}
        </Text>
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
          placeholder="Search your favorites..."
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

      {/* Favorites List */}
      {favoriteRecipes.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Feather name="heart" size={64} color="#ddd" />
          <Text style={styles.emptyTitle}>No favorites yet</Text>
          <Text style={styles.emptySubtitle}>
            Start exploring recipes and tap the heart icon to save your
            favorites!
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredRecipes}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => <FavoriteCard item={item} />}
          numColumns={2}
          contentContainerStyle={styles.listContainer}
          columnWrapperStyle={styles.row}
          ListEmptyComponent={
            searchQuery !== "" ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.noResultsText}>
                  No favorites found for "{searchQuery}"
                </Text>
              </View>
            ) : null
          }
        />
      )}
    </View>
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
    backgroundColor: "#ff4757",
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "white",
  },
  subtitle: {
    fontSize: 16,
    color: "white",
    marginTop: 5,
    opacity: 0.9,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 25,
    margin: 20,
    paddingHorizontal: 15,
    paddingVertical: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#333",
  },
  listContainer: {
    paddingHorizontal: 10,
    paddingBottom: 20,
  },
  row: {
    justifyContent: "space-between",
    paddingHorizontal: 10,
  },
  recipeCard: {
    width: "48%",
    backgroundColor: "white",
    borderRadius: 15,
    marginBottom: 15,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  recipeImage: {
    width: "100%",
    height: 120,
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
  },
  favoriteButton: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "white",
    borderRadius: 15,
    padding: 6,
  },
  cardContent: {
    padding: 12,
  },
  recipeTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
    lineHeight: 18,
  },
  recipeDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  detailText: {
    fontSize: 11,
    color: "#666",
  },
  caloriesText: {
    fontSize: 12,
    color: "#ff8c00",
    fontWeight: "500",
    marginBottom: 8,
  },
  categoriesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
  },
  categoryTag: {
    backgroundColor: "#f0f0f0",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  categoryTagText: {
    fontSize: 10,
    color: "#666",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
    marginTop: 100,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#333",
    marginTop: 20,
    marginBottom: 10,
  },
  emptySubtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    lineHeight: 22,
  },
  noResultsText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
});

export default FavoritesScreen;
