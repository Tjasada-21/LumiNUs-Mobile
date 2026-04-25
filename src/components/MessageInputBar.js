import React from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet, Platform, Text } from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';

const MessageInputBar = ({ value, onChangeText, onSend, onAttach, onEmoji, disabled, isReplying, onCancelReply, replyTo }) => {
  return (
    <View style={styles.wrapper}>
      {/* Reply Preview Bar */}
      {isReplying && replyTo && (
        <View style={styles.replyBar}>
          <View style={styles.replyContent}>
            <Text style={styles.replyLabel}>Replying to {replyTo.sender_name}</Text>
            <Text style={styles.replyText} numberOfLines={1}>{replyTo.content}</Text>
          </View>
          <TouchableOpacity onPress={onCancelReply}>
            <Ionicons name="close" size={20} color="#8E8E8E" />
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.inputContainer}>
        {/* Camera/Attach Button outside the pill */}
        <TouchableOpacity style={styles.iconButton} onPress={onAttach}>
          <View style={styles.cameraCircle}>
            <Ionicons name="camera" size={20} color="#FFFFFF" />
          </View>
        </TouchableOpacity>

        {/* The IG Gray Pill */}
        <View style={styles.pill}>
          <TextInput
            style={styles.textInput}
            placeholder="Message..."
            placeholderTextColor="#8E8E8E"
            value={value}
            onChangeText={onChangeText}
            multiline
            maxLength={500}
          />
          
          {/* Send Button replaces Mic if typing */}
          {value.trim().length > 0 ? (
            <TouchableOpacity onPress={onSend} disabled={disabled} style={styles.sendButton}>
              <Text style={styles.sendText}>Send</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.micButton}>
              <Feather name="mic" size={20} color="#262626" />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: '#FFFFFF', // IG chats usually have a solid white background at the bottom
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: '#DBDBDB',
    paddingBottom: Platform.OS === 'ios' ? 24 : 12,
  },
  replyBar: {
    flexDirection: 'row',
    backgroundColor: '#F2F2F2',
    padding: 12,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    marginHorizontal: 16,
    marginTop: 8,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  replyLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8E8E8E',
  },
  replyText: {
    fontSize: 14,
    color: '#262626',
    marginTop: 2,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingTop: 8,
  },
  iconButton: {
    padding: 4,
    marginRight: 8,
    marginBottom: 4,
  },
  cameraCircle: {
    backgroundColor: '#3797F0',
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#F2F2F2',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 8,
    minHeight: 44,
    maxHeight: 120,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: '#262626',
    paddingTop: Platform.OS === 'ios' ? 4 : 0,
    paddingBottom: 0,
    marginRight: 8,
    maxHeight: 100,
  },
  sendButton: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 2,
  },
  sendText: {
    color: '#3797F0',
    fontWeight: '600',
    fontSize: 16,
  },
  micButton: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 2,
  }
});

export default MessageInputBar;