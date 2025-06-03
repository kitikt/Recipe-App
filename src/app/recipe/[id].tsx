import {
  View,
  Text,
  Image,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
  Animated,
  Dimensions,
} from "react-native";
import { router, useLocalSearchParams, useFocusEffect } from "expo-router";
import { useEffect, useState, useRef, useCallback } from "react";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Timer from "@components/timer";

const { width } = Dimensions.get("window");

interface Recipe {
  _id: string;
  name: string;
  imageUrl: string;
  cookTime?: string;
  difficulty?: string;
  calories?: string;
  description?: string;
  ingredients?: string[];
  instructions?: string;
  categories?: { name: string }[];
}

const RecipeDetail = () => {
  const { id } = useLocalSearchParams();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [showTimer, setShowTimer] = useState(true);
  const [isFavorited, setIsFavorited] = useState(false);

  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const ingredientAnims = useRef<Animated.Value[]>([]).current;

  useEffect(() => {
    const fetchRecipe = async () => {
      try {
        const res = await fetch(`http://10.0.2.2:8080/api/recipes/${id}`);
        const data = await res.json();
        setRecipe(data);

        // Start animations when data is loaded
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(slideAnim, {
            toValue: 0,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.spring(scaleAnim, {
            toValue: 1,
            tension: 50,
            friction: 7,
            useNativeDriver: true,
          }),
        ]).start();
      } catch (error) {
        console.error("Error fetching recipe:", error);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchRecipe();
  }, [id]);

  // Check favorite status when screen is focused
  useFocusEffect(
    useCallback(() => {
      const checkFavorite = async () => {
        try {
          const storedFavorites = await AsyncStorage.getItem("likedRecipes");
          const favoriteIds: string[] = storedFavorites
            ? JSON.parse(storedFavorites)
            : [];
          setIsFavorited(favoriteIds.includes(id as string));
        } catch (error) {
          console.error("Error checking favorite status:", error);
        }
      };
      checkFavorite();
    }, [id])
  );

  // Toggle favorite status
  const toggleFavorite = async () => {
    try {
      const storedFavorites = await AsyncStorage.getItem("likedRecipes");
      let favoriteIds: string[] = storedFavorites
        ? JSON.parse(storedFavorites)
        : [];

      if (isFavorited) {
        favoriteIds = favoriteIds.filter((idItem) => idItem !== id);
      } else {
        favoriteIds.push(id as string);
      }

      await AsyncStorage.setItem("likedRecipes", JSON.stringify(favoriteIds));
      setIsFavorited(!isFavorited);
    } catch (error) {
      console.error("Error toggling favorite:", error);
    }
  };

  // Animate ingredients when they appear
  const animateIngredient = (index: number) => {
    if (!ingredientAnims[index]) {
      ingredientAnims[index] = new Animated.Value(0);
    }

    Animated.spring(ingredientAnims[index], {
      toValue: 1,
      delay: index * 100,
      tension: 50,
      friction: 7,
      useNativeDriver: true,
    }).start();
  };

  const handleBack = () => {
    router.back();
  };

  const handleTimerComplete = () => {
    setShowTimer(false);
    alert("Cooking time is up!");
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <LinearGradient
          colors={["#ff9a56", "#ffad56"]}
          style={styles.loadingGradient}
        >
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.loadingText}>Loading delicious recipe...</Text>
        </LinearGradient>
      </View>
    );
  }

  if (!recipe) {
    return (
      <View style={styles.errorContainer}>
        <LinearGradient
          colors={["#ff6b6b", "#ee5a52"]}
          style={styles.errorGradient}
        >
          <Text style={styles.errorIcon}>🍽️</Text>
          <Text style={styles.errorText}>Recipe not found</Text>
          <Text style={styles.errorSubtext}>
            The recipe you're looking for doesn't exist
          </Text>
        </LinearGradient>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Hero Image Section with Gradient Overlay and Favorite Button */}
      <Animated.View
        style={[
          styles.imageContainer,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <View style={styles.backButtonContainer}>
            <Feather name="arrow-left" size={20} color="#fff" />
            <Text style={styles.backButtonText}>Back</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.favoriteButton}
          onPress={toggleFavorite}
        >
          <Feather
            name="heart"
            size={24}
            color={isFavorited ? "#ff4757" : "#fff"}
            fill={isFavorited ? "#ff4757" : "none"}
          />
        </TouchableOpacity>

        <Image source={{ uri: recipe.imageUrl }} style={styles.image} />

        <LinearGradient
          colors={["transparent", "rgba(0,0,0,0.3)", "rgba(0,0,0,0.8)"]}
          style={styles.imageOverlay}
        >
          <Animated.View
            style={[
              styles.titleContainer,
              {
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <Text style={styles.title}>{recipe.name}</Text>
            <Text style={styles.categoryText}>
              {recipe.categories?.map((cat) => cat.name).join(", ") || "N/A"}
            </Text>
          </Animated.View>
        </LinearGradient>
      </Animated.View>

      {/* Content Section */}
      <Animated.View
        style={[
          styles.contentContainer,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        {/* Recipe Stats Cards with Gradient */}
        <View style={styles.statsContainer}>
          {recipe.cookTime && (
            <Animated.View
              style={[
                styles.statCard,
                {
                  transform: [{ scale: scaleAnim }],
                },
              ]}
            >
              <LinearGradient
                colors={["#667eea", "#764ba2"]}
                style={styles.statGradient}
              >
                <Text style={styles.statIcon}>⏱️</Text>
                <Text style={styles.statLabel}>Time</Text>
                <Text style={styles.statValue}>{recipe.cookTime}</Text>
              </LinearGradient>
            </Animated.View>
          )}
          {recipe.difficulty && (
            <Animated.View
              style={[
                styles.statCard,
                {
                  transform: [{ scale: scaleAnim }],
                },
              ]}
            >
              <LinearGradient
                colors={["#f093fb", "#f5576c"]}
                style={styles.statGradient}
              >
                <Text style={styles.statIcon}>📊</Text>
                <Text style={styles.statLabel}>Difficulty</Text>
                <Text style={styles.statValue}>{recipe.difficulty}</Text>
              </LinearGradient>
            </Animated.View>
          )}
          {recipe.calories && (
            <Animated.View
              style={[
                styles.statCard,
                {
                  transform: [{ scale: scaleAnim }],
                },
              ]}
            >
              <LinearGradient
                colors={["#4facfe", "#00f2fe"]}
                style={styles.statGradient}
              >
                <Text style={styles.statIcon}>🔥</Text>
                <Text style={styles.statLabel}>Calories</Text>
                <Text style={styles.statValue}>{recipe.calories} Kcal</Text>
              </LinearGradient>
            </Animated.View>
          )}
        </View>

        {/* Timer Section */}
        {recipe.cookTime && (
          <Animated.View
            style={[
              styles.section,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <View style={styles.sectionHeader}>
              <LinearGradient
                colors={["#ff9a56", "#ffad56"]}
                style={styles.sectionIconContainer}
              >
                <Text style={styles.sectionIcon}>⏰</Text>
              </LinearGradient>
              <Text style={styles.sectionTitle}>Timer</Text>
              {!showTimer && (
                <TouchableOpacity
                  style={styles.timerStartButton}
                  onPress={() => setShowTimer(true)}
                >
                  <Text style={styles.timerStartText}>Start Timer</Text>
                </TouchableOpacity>
              )}
            </View>
            {showTimer && (
              <Timer time={recipe.cookTime} onComplete={handleTimerComplete} />
            )}
          </Animated.View>
        )}

        {recipe.description && (
          <Animated.View
            style={[
              styles.section,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <View style={styles.sectionHeader}>
              <LinearGradient
                colors={["#ff9a56", "#ffad56"]}
                style={styles.sectionIconContainer}
              >
                <Text style={styles.sectionIcon}>📝</Text>
              </LinearGradient>
              <Text style={styles.sectionTitle}>Description</Text>
            </View>
            <View style={styles.descriptionCard}>
              <Text style={styles.descriptionText}>{recipe.description}</Text>
            </View>
          </Animated.View>
        )}

        {/* Ingredients Section with Animated Items */}
        {recipe.ingredients?.length && (
          <Animated.View
            style={[
              styles.section,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <View style={styles.sectionHeader}>
              <LinearGradient
                colors={["#43e97b", "#38f9d7"]}
                style={styles.sectionIconContainer}
              >
                <Text style={styles.sectionIcon}>🥘</Text>
              </LinearGradient>
              <Text style={styles.sectionTitle}>Ingredients</Text>
              <LinearGradient
                colors={["#ff9a56", "#ffad56"]}
                style={styles.ingredientBadge}
              >
                <Text style={styles.ingredientCount}>
                  {recipe.ingredients.length}
                </Text>
              </LinearGradient>
            </View>
            <View style={styles.ingredientsContainer}>
              {recipe.ingredients.map((ing, i) => {
                if (!ingredientAnims[i]) {
                  ingredientAnims[i] = new Animated.Value(0);
                  setTimeout(() => animateIngredient(i), 100 * i);
                }

                return (
                  <Animated.View
                    key={i}
                    style={[
                      styles.ingredientItem,
                      {
                        opacity: ingredientAnims[i],
                        transform: [
                          {
                            translateX:
                              ingredientAnims[i]?.interpolate({
                                inputRange: [0, 1],
                                outputRange: [-50, 0],
                              }) || 0,
                          },
                        ],
                      },
                    ]}
                  >
                    <LinearGradient
                      colors={["#ff9a56", "#ffad56"]}
                      style={styles.ingredientBullet}
                    />
                    <Text style={styles.ingredientText}>{ing}</Text>
                  </Animated.View>
                );
              })}
            </View>
          </Animated.View>
        )}

        {recipe.instructions && (
          <Animated.View
            style={[
              styles.section,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <View style={styles.sectionHeader}>
              <LinearGradient
                colors={["#fa709a", "#fee140"]}
                style={styles.sectionIconContainer}
              >
                <Text style={styles.sectionIcon}>👨‍🍳</Text>
              </LinearGradient>
              <Text style={styles.sectionTitle}>Instructions</Text>
            </View>
            <View style={styles.instructionsCard}>
              <Text style={styles.instructionsText}>{recipe.instructions}</Text>
            </View>
          </Animated.View>
        )}
      </Animated.View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: "#f8f9fa",
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
  errorContainer: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  errorGradient: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  errorIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 8,
    textAlign: "center",
  },
  errorSubtext: {
    fontSize: 16,
    color: "rgba(255,255,255,0.8)",
    textAlign: "center",
  },
  imageContainer: {
    position: "relative",
    height: 320,
    marginBottom: 20,
    borderRadius: 0,
    overflow: "hidden",
  },
  image: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  imageOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "60%",
    justifyContent: "flex-end",
    padding: 24,
  },
  titleContainer: {
    backgroundColor: "rgba(255,255,255,0.1)",
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#fff",
    textAlign: "center",
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  categoryText: {
    fontSize: 16,
    color: "#ddd",
    textAlign: "center",
    marginTop: 8,
  },
  backButton: {
    position: "absolute",
    top: 50,
    left: 20,
    zIndex: 10,
  },
  backButtonContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  backButtonText: {
    fontSize: 16,
    color: "#fff",
    marginLeft: 8,
    fontWeight: "500",
  },
  favoriteButton: {
    position: "absolute",
    top: 50,
    right: 20,
    zIndex: 10,
    backgroundColor: "rgba(0,0,0,0.5)",
    padding: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 32,
    gap: 12,
  },
  statCard: {
    flex: 1,
  },
  statGradient: {
    padding: 20,
    borderRadius: 20,
    alignItems: "center",
    minHeight: 160,
    justifyContent: "center",
  },
  statIcon: {
    fontSize: 28,
    marginBottom: 12,
  },
  statLabel: {
    fontSize: 12,
    color: "rgba(255,255,255,0.8)",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 8,
  },
  statValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
    textAlign: "center",
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    gap: 12,
  },
  sectionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  sectionIcon: {
    fontSize: 18,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#333",
    flex: 1,
  },
  timerStartButton: {
    padding: 8,
    backgroundColor: "#ff8c00",
    borderRadius: 15,
  },
  timerStartText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
  },
  ingredientBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    minWidth: 30,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  ingredientCount: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
  },
  descriptionCard: {
    backgroundColor: "#fff",
    padding: 24,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 6,
    borderLeftWidth: 6,
    borderLeftColor: "#ff9a56",
  },
  descriptionText: {
    fontSize: 16,
    lineHeight: 26,
    color: "#444",
    fontWeight: "400",
  },
  ingredientsContainer: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 6,
  },
  ingredientItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f5f5f5",
  },
  ingredientBullet: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 16,
    shadowColor: "#ff9a56",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2,
  },
  ingredientText: {
    fontSize: 16,
    color: "#333",
    flex: 1,
    lineHeight: 24,
    fontWeight: "500",
  },
  instructionsCard: {
    backgroundColor: "#fff",
    padding: 24,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 6,
    borderTopWidth: 6,
    borderTopColor: "#fa709a",
  },
  instructionsText: {
    fontSize: 16,
    lineHeight: 28,
    color: "#444",
    fontWeight: "400",
  },
});

export default RecipeDetail;
