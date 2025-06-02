import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import Feather from "@expo/vector-icons/Feather";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

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

const RecipeCard = ({
  item,
  onPress,
}: {
  item: Recipe;
  onPress: () => void;
}) => (
  <TouchableOpacity style={styles.recipeCard} onPress={onPress}>
    <Image source={{ uri: item.imageUrl }} style={styles.recipeImage} />
    <View style={styles.cardContent}>
      <Text style={styles.recipeTitle} numberOfLines={2}>
        {item.name}
      </Text>
      {item.calories && (
        <Text style={styles.caloriesText}>{item.calories} Kcal</Text>
      )}
    </View>
  </TouchableOpacity>
);

const FavoritesScreen = () => {
  const [favoriteRecipes, setFavoriteRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFavorites = async () => {
      try {
        const storedFavorites = await AsyncStorage.getItem("favorites");
        const favoriteIds = storedFavorites ? JSON.parse(storedFavorites) : [];

        if (favoriteIds.length === 0) {
          setFavoriteRecipes([]);
          setLoading(false);
          return;
        }

        // Fetch recipe details for each favorite ID
        const recipePromises = favoriteIds.map((id: string) =>
          fetch(`http://10.0.2.2:8080/api/recipes/${id}`).then((res) =>
            res.json()
          )
        );
        const recipes = await Promise.all(recipePromises);
        setFavoriteRecipes(recipes);
      } catch (error) {
        console.error("Error fetching favorites:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchFavorites();
  }, []);

  const handleRecipePress = (recipeId: string) => {
    router.push({
      pathname: "/recipe/[id]",
      params: { id: recipeId },
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#ff8c00" />
        <Text style={styles.loadingText}>Loading favorites...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Favorite Recipes</Text>
      {favoriteRecipes.length === 0 ? (
        <Text style={styles.noResultsText}>
          No favorite recipes yet. Add some from the home screen!
        </Text>
      ) : (
        <FlatList
          data={favoriteRecipes}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => (
            <RecipeCard
              item={item}
              onPress={() => handleRecipePress(item._id)}
            />
          )}
          numColumns={2}
          columnWrapperStyle={styles.gridRow}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    padding: 20,
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
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
  },
  recipeCard: {
    flex: 1,
    margin: 7.5,
    borderRadius: 15,
    backgroundColor: "white",
    marginBottom: 15,
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
  caloriesText: {
    fontSize: 12,
    color: "#ff8c00",
  },
  noResultsText: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
    marginVertical: 10,
  },
  gridRow: {
    justifyContent: "space-between",
    marginBottom: 10,
  },
});

export default FavoritesScreen;
