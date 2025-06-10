import LottieView from "lottie-react-native";
import { useAuth } from "../../context/AuthContext";
import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
  Platform,
  KeyboardAvoidingView,
  Keyboard,
} from "react-native";

type Message = {
  id: string;
  text: string;
  sender: "user" | "bot";
};

export default function ChatbotScreen() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const apiUrl = process.env.EXPO_PUBLIC_API_BASE_URL;
  const animation = useRef<LottieView>(null);
  const inputRef = useRef<TextInput>(null);
  const sendMessage = async () => {
    if (!inputText.trim()) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      text: inputText,
      sender: "user",
    };
    setMessages((prev) => [...prev, newMessage]);
    setInputText("");
    setIsLoading(true);

    try {
      const response = await fetch(`${apiUrl}/api/ai/suggest`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user?.token}`,
        },
        body: JSON.stringify({ message: inputText }),
      });

      const data = await response.json();

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: data.reply || "Không có phản hồi từ AI.",
        sender: "bot",
      };
      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "Đã có lỗi xảy ra khi gửi tin nhắn.",
        sender: "bot",
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const renderMessage = ({ item }: { item: Message }) => (
    <View
      style={[
        styles.messageContainer,
        item.sender === "user" ? styles.userMessage : styles.botMessage,
      ]}
    >
      <Text
        style={[
          styles.messageText,
          item.sender === "user"
            ? styles.userMessageText
            : styles.botMessageText,
        ]}
      >
        {item.text}
      </Text>
    </View>
  );
  const handleSubmit = () => {
    console.log("Submit triggered");
    if (inputText.trim()) {
      sendMessage();
      if (inputRef.current) {
        inputRef.current.blur();
        Keyboard.dismiss();
      }
    }
  };
  return (
    <View style={styles.container}>
      <LottieView
        ref={animation}
        source={require("@assets/animations/animation_chatbot.json")}
        autoPlay
        loop
        style={styles.backgroundAnimation}
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.keyboardAvoidingContainer}
        keyboardVerticalOffset={Platform.OS === "ios" ? 10 : 0}
      >
        <SafeAreaView style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>AI Cooking Assistant</Text>
          </View>

          <FlatList
            data={messages}
            renderItem={renderMessage}
            keyExtractor={(item) => item.id}
            style={styles.chatList}
            contentContainerStyle={styles.chatContent}
            showsVerticalScrollIndicator={false}
          />

          {isLoading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="red" />
              <Text style={styles.loadingText}> Loading...</Text>
            </View>
          )}

          <View style={styles.inputContainer}>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                value={inputText}
                onChangeText={setInputText}
                placeholder="Input your ingredients here..."
                placeholderTextColor="#8E8E93"
                maxLength={500}
                ref={inputRef}
                onSubmitEditing={handleSubmit}
                returnKeyType="send"
                blurOnSubmit={true}
              />
              <TouchableOpacity
                style={[
                  styles.sendButton,
                  (!inputText.trim() || isLoading) && styles.sendButtonDisabled,
                ]}
                onPress={sendMessage}
                disabled={!inputText.trim() || isLoading}
              >
                <Text
                  style={[
                    styles.sendButtonText,
                    (!inputText.trim() || isLoading) &&
                      styles.sendButtonTextDisabled,
                  ]}
                >
                  Send
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "black",
    flex: 1,
  },
  backgroundAnimation: {
    position: "absolute",
    marginTop: 0,
    width: "100%",
    height: "100%",
    zIndex: 0,
  },
  keyboardAvoidingContainer: {
    flex: 1.5,
  },
  content: {
    flex: 1,
    backgroundColor: "rgba(17, 17, 17, 0.7)",
  },
  header: {
    backgroundColor: "transparent",
    paddingVertical: 16,
    paddingHorizontal: 20,
    ...Platform.select({
      ios: {
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  headerTitle: {
    fontSize: 48,
    fontWeight: "700",
    color: "#fff",
    textAlign: "center",
    textShadowColor: "rgba(255, 255, 255, 0.5)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
    zIndex: 2,
  },
  chatList: {
    flex: 1,
  },
  chatContent: {
    padding: 16,
    paddingBottom: 20,
  },
  messageContainer: {
    marginVertical: 4,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    maxWidth: "85%",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  userMessage: {
    backgroundColor: "#007AFF",
    alignSelf: "flex-end",
    marginLeft: "15%",
  },
  botMessage: {
    backgroundColor: "#FFFFFF",
    alignSelf: "flex-start",
    marginRight: "15%",
    borderWidth: 0.5,
    borderColor: "#E5E5EA",
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  userMessageText: {
    color: "#FFFFFF",
  },
  botMessageText: {
    color: "#000000",
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    backgroundColor: "transparent",
  },
  loadingText: {
    fontSize: 28,
    fontWeight: "100",
    color: "#fff",
    textAlign: "center",
    textShadowColor: "rgba(255, 255, 255, 0.5)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
    zIndex: 2,
  },
  inputContainer: {
    backgroundColor: "transparent",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 0.5,
    ...Platform.select({
      ios: {
        paddingBottom: 34,
      },
    }),
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "flex-end",
    backgroundColor: "#F2F2F7",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    minHeight: 44,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: "#000000",
    maxHeight: 100,
    paddingVertical: 8,
    paddingRight: 12,
  },
  sendButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    marginLeft: 8,
    minWidth: 50,
    alignItems: "center",
    justifyContent: "center",
  },
  sendButtonDisabled: {
    backgroundColor: "#C7C7CC",
  },
  sendButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  sendButtonTextDisabled: {
    color: "#FFFFFF",
  },
});
