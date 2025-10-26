import React from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from "react-native";
import { Video } from "expo-av";

export default function AlbumScreen({ route }) {
  const { videos } = route.params;

  if (!videos || videos.length === 0) return <Text style={{ textAlign: "center", marginTop: 20 }}>No videos yet</Text>;

  return (
    <FlatList
      data={videos}
      keyExtractor={(item) => item}
      renderItem={({ item }) => (
        <View style={styles.videoContainer}>
          <Video
            source={{ uri: item }}
            style={styles.video}
            useNativeControls
            resizeMode="contain"
          />
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  videoContainer: {
    marginVertical: 10,
    alignItems: "center",
  },
  video: {
    width: "90%",
    height: 200,
  },
});
