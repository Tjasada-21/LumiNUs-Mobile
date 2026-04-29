import React from 'react';
import { Dimensions, View, Text, Image, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const ChatDetailsScreen = ({ route, navigation }) => {
  // Placeholder data
  const group = route?.params?.group || {
    name: 'Project Group',
    avatar: 'https://randomuser.me/api/portraits/men/2.jpg',
    members: [
      { id: 1, name: 'Jane Doe', avatar: 'https://randomuser.me/api/portraits/women/1.jpg' },
      { id: 2, name: 'John Smith', avatar: 'https://randomuser.me/api/portraits/men/2.jpg' },
    ],
    media: [
      { id: 1, uri: 'https://placekitten.com/200/200' },
      { id: 2, uri: 'https://placekitten.com/201/200' },
    ],
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Image source={{ uri: group.avatar }} style={styles.avatar} />
        <Text style={styles.name}>{group.name}</Text>
      </View>
      <Text style={styles.sectionTitle}>Members</Text>
      <FlatList
        data={group.members}
        keyExtractor={item => String(item.id)}
        renderItem={({ item }) => (
          <View style={styles.memberRow}>
            <Image source={{ uri: item.avatar }} style={styles.memberAvatar} />
            <Text style={styles.memberName}>{item.name}</Text>
          </View>
        )}
        horizontal
        style={{ marginBottom: 12 }}
      />
      <Text style={styles.sectionTitle}>Shared Media</Text>
      <FlatList
        data={group.media}
        keyExtractor={item => String(item.id)}
        renderItem={({ item }) => (
          <Image source={{ uri: item.uri }} style={styles.mediaImage} />
        )}
        horizontal
      />
      <TouchableOpacity style={styles.leaveBtn}>
        <Ionicons name="exit-outline" size={18} color="#E57373" />
        <Text style={styles.leaveBtnText}>Leave Group</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: Math.max(14, Math.min(20, SCREEN_WIDTH * 0.04)) },
  header: { alignItems: 'center', marginBottom: Math.max(14, Math.min(22, SCREEN_HEIGHT * 0.024)) },
  avatar: { width: Math.max(64, Math.min(84, SCREEN_WIDTH * 0.18)), height: Math.max(64, Math.min(84, SCREEN_WIDTH * 0.18)), borderRadius: Math.max(32, Math.min(42, SCREEN_WIDTH * 0.09)), marginBottom: 8 },
  name: { fontWeight: 'bold', fontSize: Math.max(18, Math.min(22, SCREEN_WIDTH * 0.05)), color: '#222' },
  sectionTitle: { fontWeight: 'bold', color: '#31429B', marginTop: 16, marginBottom: 6, fontSize: Math.max(14, Math.min(16, SCREEN_WIDTH * 0.04)) },
  memberRow: { alignItems: 'center', marginRight: 16 },
  memberAvatar: { width: Math.max(36, Math.min(44, SCREEN_WIDTH * 0.1)), height: Math.max(36, Math.min(44, SCREEN_WIDTH * 0.1)), borderRadius: Math.max(18, Math.min(22, SCREEN_WIDTH * 0.05)), marginBottom: 4 },
  memberName: { fontSize: Math.max(12, Math.min(14, SCREEN_WIDTH * 0.034)), color: '#222' },
  mediaImage: { width: Math.max(56, Math.min(80, SCREEN_WIDTH * 0.18)), height: Math.max(56, Math.min(80, SCREEN_WIDTH * 0.18)), borderRadius: 8, marginRight: 8 },
  leaveBtn: { flexDirection: 'row', alignItems: 'center', marginTop: 32, alignSelf: 'center', paddingHorizontal: 10, paddingVertical: 8 },
  leaveBtnText: { color: '#E57373', fontWeight: 'bold', marginLeft: 6, fontSize: Math.max(14, Math.min(16, SCREEN_WIDTH * 0.036)) },
});

export default ChatDetailsScreen;
