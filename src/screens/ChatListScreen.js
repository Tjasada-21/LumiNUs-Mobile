import React from 'react';
import { View, Text, FlatList, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const ChatListScreen = ({ navigation, chats }) => {
  // Placeholder data for now
  const chatData = chats || [
    {
      id: 1,
      name: 'Jane Doe',
      lastMessage: 'Hey! How are you?',
      avatar: 'https://randomuser.me/api/portraits/women/1.jpg',
      unread: 2,
      isGroup: false,
      lastSeen: 'Active 2h ago',
    },
    {
      id: 2,
      name: 'Project Group',
      lastMessage: 'Let’s meet at 5pm',
      avatar: 'https://randomuser.me/api/portraits/men/2.jpg',
      unread: 0,
      isGroup: true,
      lastSeen: 'Active now',
    },
  ];

  const renderItem = ({ item }) => (
    <TouchableOpacity style={styles.chatRow} onPress={() => navigation.navigate('ConvoScreen', { contactId: item.id })}>
      <Image source={{ uri: item.avatar }} style={styles.avatar} />
      <View style={styles.chatInfo}>
        <Text style={styles.chatName} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.lastMessage} numberOfLines={1}>{item.lastMessage}</Text>
      </View>
      {item.unread > 0 && (
        <View style={styles.unreadBadge}>
          <Text style={styles.unreadText}>{item.unread}</Text>
        </View>
      )}
      <Ionicons name="chevron-forward" size={20} color="#B6C3D6" />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={chatData}
        renderItem={renderItem}
        keyExtractor={item => String(item.id)}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  listContent: { paddingVertical: 8 },
  chatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    backgroundColor: '#fff',
  },
  avatar: { width: 48, height: 48, borderRadius: 24, marginRight: 12 },
  chatInfo: { flex: 1 },
  chatName: { fontWeight: 'bold', fontSize: 16, color: '#222' },
  lastMessage: { color: '#888', fontSize: 14, marginTop: 2 },
  unreadBadge: {
    backgroundColor: '#31429B',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    paddingHorizontal: 6,
  },
  unreadText: { color: '#fff', fontWeight: 'bold', fontSize: 13 },
});

export default ChatListScreen;
