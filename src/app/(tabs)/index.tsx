import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  FlatList,
  Image,
  ImageSourcePropType,
} from "react-native";

interface Recipe {
  id: string;
  title: string;
  image?: ImageSourcePropType;
  time?: string;
  difficulty?: string;
  calories?: string;
}

const Home = () => {
  const [activeCategory, setActiveCategory] = useState("All");
  const categories = ["All", "Breakfast", "Main Course", "Soup"];

  const needToTryRecipes: Recipe[] = [
    {
      id: "1",
      title: "Leek & kale hash with sage fried eggs",
      time: "1h",
      difficulty: "Easy",
      calories: "431 Kcal",
      image: require("@assets/images/healthysalad.png"),
    },
    {
      id: "2",
      title: "Onion & Chard Rustic and easy",
      time: "45m",
      difficulty: "Medium",
      calories: "320 Kcal",
      image: require("@assets/images/potatoe.png"),
    },
    {
      id: "3",
      title: "Leek & kale hash with sage fried eggs",
      time: "1h",
      difficulty: "Easy",
      calories: "431 Kcal",
      image: require("@assets/images/healthysalad.png"),
    },
    {
      id: "4",
      title: "Leek & kale hash with sage fried eggs",
      time: "1h",
      difficulty: "Easy",
      calories: "431 Kcal",
      image: require("@assets/images/healthysalad.png"),
    },
  ];

  const weeklyRecipes: Recipe[] = [
    {
      id: "3",
      title: "Spicy Chicken Stir-fry",
      image: require("@assets/images/desert.png"),
      time: "30m",
      difficulty: "Medium",
      calories: "450 Kcal",
    },
    {
      id: "4",
      title: "Vegetable Soup",
      image: require("@assets/images/pasta.png"),
      time: "40m",
      difficulty: "Easy",
      calories: "230 Kcal",
    },
    {
      id: "8",
      title: "Spicy Chicken Stir-fry",
      image: require("@assets/images/desert.png"),
      time: "30m",
      difficulty: "Medium",
      calories: "450 Kcal",
    },
    {
      id: "9",
      title: "Spicy Chicken Stir-fry",
      image: require("@assets/images/desert.png"),
      time: "30m",
      difficulty: "Medium",
      calories: "450 Kcal",
    },
  ];

  const handleCategoryPress = (category: string) => {
    setActiveCategory(category);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Your Personal Digital Cookbook</Text>
      </View>

      {/* Categories */}
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

      {/* Need to try section */}
      <Text style={styles.sectionTitle}>Need to try (14 recipes)</Text>
      <View style={{ marginBottom: 20 }}>
        <FlatList
          horizontal
          data={needToTryRecipes}
          renderItem={({ item }) => (
            <View style={styles.recipeCard}>
              <Image source={item.image} style={styles.recipeImage} />
              <Text style={styles.recipeTitle}>{item.title}</Text>
              <View style={styles.recipeDetails}>
                <Text style={styles.detailText}>{item.time}</Text>
                <Text style={styles.detailText}>{item.difficulty}</Text>
                <Text style={styles.detailText}>{item.calories}</Text>
              </View>
            </View>
          )}
          keyExtractor={(item) => item.id}
          showsHorizontalScrollIndicator={false}
        />
      </View>

      {/* Today’s Tip */}
      <View style={styles.tipContainer}>
        <Text style={styles.tipTitle}>💡 Today’s Tip</Text>
        <Text style={styles.tipText}>
          Drink a glass of water 30 minutes before your meal – it may help
          reduce calorie intake and boost metabolism.
        </Text>
      </View>

      {/* Popular Recipes */}
      <Text style={styles.sectionTitle}>Popular recipes</Text>
      <FlatList
        horizontal
        data={weeklyRecipes}
        renderItem={({ item }) => (
          <View style={styles.popularRecipeCard}>
            <Image source={item.image} style={styles.popularRecipeImage} />
            <View style={styles.popularRecipeInfo}>
              <Text style={styles.popularRecipeTitle}>{item.title}</Text>
              <Text style={styles.popularRecipeCalories}>{item.calories}</Text>
            </View>
          </View>
        )}
        keyExtractor={(item) => item.id}
        showsHorizontalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    marginTop: 30,
    padding: 10,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 10,
  },
  categories: {
    flexDirection: "row",
    justifyContent: "flex-start",
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
    height: 120,
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
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
    width: "100%",
    position: "absolute",
    bottom: 10,
    alignItems: "center",
  },
  detailText: {
    fontSize: 12,
    color: "#666",
    marginHorizontal: 5,
    textAlign: "center",
  },
  tipContainer: {
    backgroundColor: "#fff3e0",
    borderRadius: 12,
    padding: 15,
    marginTop: 0,
    marginVertical: 10,
    marginHorizontal: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
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
  popularRecipeCard: {
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
  popularRecipeImage: {
    width: "100%",
    height: 120,
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
  },
  popularRecipeInfo: {
    padding: 10,
    alignItems: "center",
  },
  popularRecipeTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 5,
  },
  popularRecipeCalories: {
    fontSize: 14,
    color: "#666",
  },
});

export default Home;
