// src/components/Timer.tsx
import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";

interface TimerProps {
  time: string; // Định dạng: "10 minutes"
  onComplete?: () => void;
}

const Timer = ({ time, onComplete }: TimerProps) => {
  const [seconds, setSeconds] = useState(0);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    const parseTime = (timeStr: string) => {
      const match = timeStr.match(/(\d+)\s*minutes?/i);
      if (match) {
        const minutes = parseInt(match[1], 10);
        return minutes * 60;
      }
      return 0;
    };

    if (time) {
      const totalSeconds = parseTime(time);
      setSeconds(totalSeconds);
    }
  }, [time]);

  useEffect(() => {
    let interval: number | undefined;
    if (isActive && seconds > 0) {
      interval = setInterval(() => {
        setSeconds((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    } else if (seconds === 0 && isActive) {
      setIsActive(false);
      if (onComplete) onComplete();
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, seconds, onComplete]);

  const toggleTimer = () => {
    setIsActive(!isActive);
  };

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  return (
    <View style={styles.timerContainer}>
      <Text style={styles.timerText}>{formatTime(seconds) || "0:00"}</Text>
      {/* Thêm fallback */}
      <TouchableOpacity style={styles.timerButton} onPress={toggleTimer}>
        <Feather name={isActive ? "pause" : "play"} size={20} color="#fff" />
        <Text style={styles.timerButtonText}>
          {isActive ? "Pause" : "Start"}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  timerContainer: {
    padding: 20,
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 6,
  },
  timerText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
  },
  timerButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ff8c00",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  timerButtonText: {
    color: "#fff",
    fontSize: 16,
    marginLeft: 8,
  },
});

export default Timer;
