import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Alert,
  StyleSheet,
} from "react-native";
import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { router } from "expo-router";

interface Recipe {
  _id: string;
  name: string;
  imageUrl: string;
}

const RecipeManagement = () => {
  const { user } = useAuth();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const apiUrl = process.env.EXPO_PUBLIC_API_BASE_URL;

  useEffect(() => {
    const fetchRecipes = async () => {
      try {
        const res = await fetch(`${apiUrl}/api/recipes`, {
          headers: user ? { Authorization: `Bearer ${user.token}` } : {},
        });
        if (!res.ok) throw new Error("Failed to fetch recipes");
        const data = await res.json();
        setRecipes(data);
      } catch (error) {
        console.error("Error fetching recipes:", error);
      }
    };
    fetchRecipes();
  }, [user]);

  const handleDelete = async (recipeId: string) => {
    Alert.alert("Xác nhận", "Bạn có chắc muốn xóa công thức này?", [
      { text: "Hủy", style: "cancel" },
      {
        text: "Xóa",
        style: "destructive",
        onPress: async () => {
          try {
            const res = await fetch(`${apiUrl}/api/recipes/${recipeId}`, {
              method: "DELETE",
              headers: { Authorization: `Bearer ${user?.token}` },
            });
            if (res.ok) {
              setRecipes(recipes.filter((recipe) => recipe._id !== recipeId));
              Alert.alert("Thành công", "Công thức đã được xóa.");
            } else {
              throw new Error("Failed to delete recipe");
            }
          } catch (error) {
            console.error("Error deleting recipe:", error);
            Alert.alert("Lỗi", "Không thể xóa công thức.");
          }
        },
      },
    ]);
  };

  const handleEdit = (recipeId: string) => {
    router.push({
      pathname: "/recipe/edit/[id]",
      params: { id: recipeId },
    });
  };

  const renderItem = ({ item }: { item: Recipe }) => (
    <View style={styles.recipeItem}>
      <Text style={styles.recipeName}>{item.name}</Text>
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => handleEdit(item._id)}
        >
          <Text style={styles.buttonText}>Sửa</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDelete(item._id)}
        >
          <Text style={styles.buttonText}>Xóa</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Quản lý Công thức</Text>
      <FlatList
        data={recipes}
        renderItem={renderItem}
        keyExtractor={(item) => item._id}
        ListEmptyComponent={
          <Text style={styles.emptyText}>Không có công thức.</Text>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#f8f9fa",
  },
  header: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 16,
    textAlign: "center",
  },
  recipeItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    backgroundColor: "#fff",
    borderRadius: 8,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  recipeName: {
    fontSize: 16,
    color: "#333",
  },
  buttonContainer: {
    flexDirection: "row",
    gap: 8,
  },
  editButton: {
    backgroundColor: "#ffad56",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 4,
  },
  deleteButton: {
    backgroundColor: "#ff4757",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 4,
  },
  buttonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
  },
  emptyText: {
    textAlign: "center",
    color: "#666",
    marginTop: 20,
  },
});

export default RecipeManagement;
