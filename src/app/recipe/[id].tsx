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
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { router, useLocalSearchParams, useFocusEffect } from "expo-router";
import { useEffect, useState, useRef, useCallback } from "react";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Timer from "@components/timer";
import { useAuth } from "context/AuthContext";

const { width } = Dimensions.get("window");

interface Recipe {
  _id: string;
  name: string;
  imageUrl: string;
  cookTime?: string;
  difficulty?: string;
  calories?: string;
  comments?: Comment[];
  description?: string;
  ingredients?: string[];
  instructions?: string;
  categories?: { name: string }[];
}

interface Comment {
  _id: string;
  content: string;
  user: { _id: string; name: string };
  createdAt?: string;
}

const RecipeDetail = () => {
  const { id } = useLocalSearchParams();
  const { user } = useAuth();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [showTimer, setShowTimer] = useState(true);
  const [isFavorited, setIsFavorited] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [comments, setComments] = useState<Comment[]>([]);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const ingredientAnims = useRef<Animated.Value[]>([]).current;
  const apiUrl = process.env.EXPO_PUBLIC_API_BASE_URL;

  // Hàm tạo key động cho AsyncStorage
  const getBookmarkKey = useCallback(() => {
    return user ? `bookmarkedRecipes_${user.id}` : `bookmarkedRecipes_guest`;
  }, [user]);

  // Hàm kiểm tra trạng thái bookmark
  const checkFavorite = useCallback(async () => {
    try {
      const bookmarkKey = getBookmarkKey();
      const storedFavorites = await AsyncStorage.getItem(bookmarkKey);
      const favoriteIds: string[] = storedFavorites
        ? JSON.parse(storedFavorites)
        : [];
      setIsFavorited(favoriteIds.includes(id as string));
    } catch (error) {
      console.error("Error checking bookmark status:", error);
    }
  }, [id, getBookmarkKey]);

  // Hàm toggle bookmark
  const toggleFavorite = async () => {
    try {
      const bookmarkKey = getBookmarkKey();
      const storedFavorites = await AsyncStorage.getItem(bookmarkKey);
      let favoriteIds: string[] = storedFavorites
        ? JSON.parse(storedFavorites)
        : [];

      const isCurrentlyFavorited = favoriteIds.includes(id as string);
      if (isCurrentlyFavorited) {
        favoriteIds = favoriteIds.filter((idItem) => idItem !== id);
      } else {
        favoriteIds.push(id as string);
      }

      await AsyncStorage.setItem(bookmarkKey, JSON.stringify(favoriteIds));
      setIsFavorited(!isCurrentlyFavorited);
    } catch (error) {
      console.error("Error toggling favorite:", error);
    }
  };
  // RecipeDetail.tsx
  useEffect(() => {
    const fetchRecipe = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${apiUrl}/api/recipes/${id}`, {
          headers: user ? { Authorization: `Bearer ${user.token}` } : {},
        });
        if (!res.ok) {
          throw new Error("Failed to fetch recipe");
        }
        const data = await res.json();
        setRecipe(data);

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

    const fetchComments = async () => {
      try {
        const res = await fetch(`${apiUrl}/api/comments/${id}`);
        const data = await res.json();
        setComments(data);
      } catch (error) {
        console.error("Error fetching comments:", error);
      }
    };

    // Làm mới bookmark khi user thay đổi
    if (id) {
      fetchRecipe();
      fetchComments();
      checkFavorite();
    }
  }, [id, apiUrl, user, checkFavorite]); // Thêm user vào dependencies để làm mới khi user thay đổi
  useFocusEffect(
    useCallback(() => {
      checkFavorite();
    }, [checkFavorite])
  );

  const handleAddComment = async () => {
    if (!newComment.trim() || !user) {
      console.log("Không thêm bình luận: Nội dung rỗng hoặc chưa đăng nhập");
      return;
    }

    try {
      const commentData = {
        recipeId: id,
        content: newComment,
      };

      const res = await fetch(`${apiUrl}/api/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify(commentData),
      });
      console.log("Response status:", res.status);
      const data = await res.json();
      console.log("Phản hồi từ server:", data);

      if (res.ok) {
        setComments([...comments, data]);
        setNewComment("");
        console.log("Thêm bình luận thành công!");
      } else {
        console.error(
          "Thêm bình luận thất bại:",
          data.message || "Unknown error"
        );
        alert(data.message || "Failed to add comment");
      }
    } catch (error) {
      console.error("Lỗi khi gửi yêu cầu thêm bình luận:", error);
      alert("Lỗi khi thêm bình luận. Vui lòng thử lại!");
    }
  };

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

        {user && (
          <TouchableOpacity
            style={styles.favoriteButton}
            onPress={toggleFavorite}
          >
            <Feather
              name="bookmark"
              size={24}
              color={isFavorited ? "#ff4757" : "#fff"}
              fill={isFavorited ? "#ff4757" : "none"}
            />
          </TouchableOpacity>
        )}

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
                  borderRadius: 40,
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

        {/* Comments Section */}
        <KeyboardAvoidingView
          style={{ flex: 1, justifyContent: "center" }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
        >
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
                colors={["#6a11cb", "#2575fc"]}
                style={styles.sectionIconContainer}
              >
                <Text style={styles.sectionIcon}>🗨️</Text>
              </LinearGradient>
              <Text style={styles.sectionTitle}>Comments</Text>
            </View>
            <View style={styles.commentsContainer}>
              {comments.length > 0 ? (
                comments.map((comment, index) => (
                  <View key={index} style={styles.commentItem}>
                    <Text style={styles.commentUser}>{comment.user.name}</Text>
                    <Text style={styles.commentContent}>{comment.content}</Text>
                    {comment.createdAt && (
                      <Text style={styles.commentTime}>
                        {new Date(comment.createdAt).toLocaleString()}
                      </Text>
                    )}
                  </View>
                ))
              ) : (
                <Text style={styles.noCommentsText}>No comments yet.</Text>
              )}
              {user && (
                <View style={styles.commentInputContainer}>
                  <TextInput
                    style={styles.commentInput}
                    value={newComment}
                    onChangeText={setNewComment}
                    placeholder="Add a comment..."
                  />
                  <TouchableOpacity
                    style={styles.postButton}
                    onPress={handleAddComment}
                  >
                    <Text style={styles.postButtonText}>Post</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </Animated.View>
        </KeyboardAvoidingView>
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
    borderRadius: 40,
  },
  statGradient: {
    padding: 20,
    alignItems: "center",
    minHeight: 160,
    justifyContent: "center",
    borderRadius: 40,
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
  commentsContainer: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 6,
  },
  commentItem: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f5f5f5",
  },
  commentUser: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  commentContent: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
  },
  commentTime: {
    fontSize: 12,
    color: "#999",
    marginTop: 4,
  },
  noCommentsText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginVertical: 16,
  },
  commentInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 16,
  },
  commentInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    padding: 8,
    marginRight: 8,
  },
  postButton: {
    backgroundColor: "#ff9a56",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  postButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
  },
});

export default RecipeDetail;
