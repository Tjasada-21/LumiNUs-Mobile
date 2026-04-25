import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const MessageBubble = ({ message, isOutgoing, showAvatar, senderAvatar, onLongPress, read }) => {
  // If no reactions exist, default to null
  const hasReactions = message.reactions && Object.keys(message.reactions).length > 0;

  return (
    <View style={[styles.messageRow, isOutgoing ? styles.rowOutgoing : styles.rowIncoming]}>
      
      {/* Avatar (Only show for incoming messages, and typically only on the last message of a group) */}
      {!isOutgoing && (
        showAvatar ? 
          <Image source={{ uri: senderAvatar }} style={styles.avatar} /> : 
          <View style={styles.avatarSpacer} />
      )}

      <View style={styles.bubbleWrapper}>
        <TouchableOpacity
          activeOpacity={0.8}
          onLongPress={onLongPress}
          style={[
            styles.bubble,
            isOutgoing ? styles.bubbleOutgoing : styles.bubbleIncoming,
            hasReactions && styles.bubbleWithReaction // Add bottom padding if it has a reaction badge
          ]}
        >
          {/* If there's an image attachment */}
          {message.attachment && (
            <Image source={{ uri: message.attachment }} style={styles.attachmentImage} />
          )}

          {/* The Text */}
          {message.content ? (
            <Text style={[styles.messageText, isOutgoing ? styles.textOutgoing : styles.textIncoming]}>
              {message.content}
            </Text>
          ) : null}
        </TouchableOpacity>

        {/* The Overlapping Instagram Reaction Badge */}
        {hasReactions && (
          <View style={[styles.reactionBadge, isOutgoing ? styles.reactionBadgeOutgoing : styles.reactionBadgeIncoming]}>
            {Object.entries(message.reactions).map(([emoji, count]) => (
              <Text key={emoji} style={styles.reactionText}>
                {emoji} {count > 1 ? count : ''}
              </Text>
            ))}
          </View>
        )}
      </View>

      {/* Tiny Read Receipt for Outgoing */}
      {isOutgoing && read && (
        <Text style={styles.readReceipt}>Seen</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  messageRow: {
    flexDirection: 'row',
    marginVertical: 4,
    paddingHorizontal: 16,
    alignItems: 'flex-end', // Aligns avatar to the bottom of the bubble
  },
  rowOutgoing: {
    justifyContent: 'flex-end',
  },
  rowIncoming: {
    justifyContent: 'flex-start',
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    marginRight: 8,
  },
  avatarSpacer: {
    width: 36, // 28 width + 8 margin
  },
  bubbleWrapper: {
    position: 'relative',
    maxWidth: '75%',
  },
  bubble: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 22, // The deep Instagram curve
  },
  bubbleOutgoing: {
    backgroundColor: '#3797F0', // Classic IG Blue
    borderBottomRightRadius: 4, // Sharp inner corner
  },
  bubbleIncoming: {
    backgroundColor: '#EFEFEF', // Soft IG Gray
    borderBottomLeftRadius: 4, // Sharp inner corner
  },
  bubbleWithReaction: {
    marginBottom: 8, // Give space for the overlapping reaction
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  textOutgoing: {
    color: '#FFFFFF',
  },
  textIncoming: {
    color: '#000000',
  },
  attachmentImage: {
    width: 200,
    height: 200,
    borderRadius: 12,
    marginBottom: 4,
  },
  reactionBadge: {
    position: 'absolute',
    bottom: -6, // Pulls it down to overlap the border
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: '#EFEFEF',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 2,
  },
  reactionBadgeOutgoing: {
    right: 12, // Pin to the right for sent messages
  },
  reactionBadgeIncoming: {
    left: 12, // Pin to the left for received messages
  },
  reactionText: {
    fontSize: 12,
  },
  readReceipt: {
    fontSize: 11,
    color: '#8E8E8E',
    marginLeft: 4,
    marginBottom: 2,
  }
});

export default MessageBubble;