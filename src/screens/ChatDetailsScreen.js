import React from 'react';
import { View, Text, Image, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

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
  container: { flex: 1, backgroundColor: '#fff', padding: 16 },
  header: { alignItems: 'center', marginBottom: 18 },
  avatar: { width: 72, height: 72, borderRadius: 36, marginBottom: 8 },
  name: { fontWeight: 'bold', fontSize: 20, color: '#222' },
  sectionTitle: { fontWeight: 'bold', color: '#31429B', marginTop: 16, marginBottom: 6, fontSize: 15 },
  memberRow: { alignItems: 'center', marginRight: 16 },
  memberAvatar: { width: 40, height: 40, borderRadius: 20, marginBottom: 4 },
  memberName: { fontSize: 13, color: '#222' },
  mediaImage: { width: 60, height: 60, borderRadius: 8, marginRight: 8 },
  leaveBtn: { flexDirection: 'row', alignItems: 'center', marginTop: 32, alignSelf: 'center' },
  leaveBtnText: { color: '#E57373', fontWeight: 'bold', marginLeft: 6, fontSize: 15 },
});

export default ChatDetailsScreen;
