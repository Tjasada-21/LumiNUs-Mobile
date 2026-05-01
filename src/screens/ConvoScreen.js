import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Image,
  Keyboard,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import api from '../services/api';
import { getAuthToken } from '../services/authStorage';
import CustomKeyboardView from '../components/CustomKeyboardView';
import styles from '../styles/ConvoScreen.styles';
import ChatHeader from '../components/ChatHeader';
import MessageBubble from '../components/MessageBubble';
import MessageInputBar from '../components/MessageInputBar';
import { useUnreadMessages } from '../context/UnreadMessagesContext';

const REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '👏'];
const { width: SCREEN_WIDTH } = Dimensions.get('window');

const toMentionHandle = (firstName, lastName) => {
  const normalizedHandle = `${firstName ?? ''}_${lastName ?? ''}`
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_.-]/g, '')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '');

  return normalizedHandle || 'alumni';
};

const extractMentionQuery = (value) => {
  const text = String(value ?? '');
  const match = text.match(/(^|\s)@([a-zA-Z0-9_.-]*)$/);

  if (!match) {
    return null;
  }

  const query = match[2] ?? '';
  const mentionStart = text.length - query.length - 1;

  return {
    query,
    mentionStart,
    mentionEnd: text.length,
  };
};

const normalizeMessageList = (value) => {
  if (Array.isArray(value)) {
    return value;
  }

  if (Array.isArray(value?.messages)) {
    return value.messages;
  }

  if (Array.isArray(value?.data)) {
    return value.data;
  }

  return [];
};

const getAvatarUri = (name, fallbackUri) => {
  if (fallbackUri) {
    return fallbackUri;
  }

  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'User')}&background=31429B&color=fff`;
};

const formatMessageTime = (value) => {
  if (!value) {
    return '';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return date.toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  });
};

const getMessageDate = (message) => {
  const rawValue = message?.created_at ?? message?.sent_at ?? message?.updated_at;

  if (!rawValue) {
    return null;
  }

  const date = new Date(rawValue);

  return Number.isNaN(date.getTime()) ? null : date;
};

const isSameMinute = (firstDate, secondDate) => {
  if (!firstDate || !secondDate) {
    return false;
  }

  return firstDate.getFullYear() === secondDate.getFullYear()
    && firstDate.getMonth() === secondDate.getMonth()
    && firstDate.getDate() === secondDate.getDate()
    && firstDate.getHours() === secondDate.getHours()
    && firstDate.getMinutes() === secondDate.getMinutes();
};

export default function ConvoScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const flatListRef = useRef(null);
  const { refreshUnreadMessages } = useUnreadMessages();

  const params = route?.params ?? {};
  const contactId = params.contactId ?? params.userId ?? params.id ?? null;
  const groupId = params.groupId ?? null;
  const isGroup = Boolean(groupId);

  const conversationName = params.contactName ?? params.groupName ?? 'Chat';
  const conversationAvatar = params.contactAvatar ?? params.contactPhoto ?? params.avatar ?? '';
  const conversationStatus = params.contactStatus ?? params.status ?? '';
  const groupMembers = Array.isArray(params.groupMembers) ? params.groupMembers : [];

  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [draft, setDraft] = useState('');
  const [currentUserId, setCurrentUserId] = useState(null);
  const [replyTo, setReplyTo] = useState(null);
  const [actionMessage, setActionMessage] = useState(null);
  const [showActions, setShowActions] = useState(false);
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [connections, setConnections] = useState([]);

  const hasConversation = Boolean(contactId || groupId);
  const allowMentions = isGroup;
  const headerSubtitle = isGroup
    ? (groupMembers.map((member) => member?.name).filter(Boolean).join(', ') || 'Group chat')
    : (conversationStatus || 'Active now');

  const mentionContext = useMemo(() => (allowMentions ? extractMentionQuery(draft) : null), [allowMentions, draft]);

  const mentionSuggestions = useMemo(() => {
    if (!allowMentions || !mentionContext) {
      return [];
    }

    const query = mentionContext.query.toLowerCase();

    return connections
      .map((connection) => {
        const firstName = connection?.first_name ?? '';
        const lastName = connection?.last_name ?? '';
        const fullName = `${firstName} ${lastName}`.trim() || 'Alumni';
        const avatar = connection?.alumni_photo
          ? connection.alumni_photo
          : `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=31429B&color=fff`;

        return {
          id: connection?.id,
          name: fullName,
          handle: toMentionHandle(firstName, lastName),
          avatar,
        };
      })
      .filter((item) => {
        if (!query) {
          return true;
        }

        return item.name.toLowerCase().includes(query) || item.handle.includes(query);
      })
      .slice(0, 5);
  }, [allowMentions, connections, mentionContext]);

  const scrollToBottom = useCallback((animated = false) => {
    requestAnimationFrame(() => {
      flatListRef.current?.scrollToEnd({ animated });
    });
  }, []);

  const loadCurrentUser = useCallback(async () => {
    try {
      const token = await getAuthToken();
      if (!token) {
        return;
      }

      const response = await api.get('/user', {
        headers: { Authorization: `Bearer ${token}` },
      });

      const contactsResponse = await api.get('/contacts', {
        headers: { Authorization: `Bearer ${token}` },
      });

      const userId = response.data?.id ?? response.data?.user?.id ?? response.data?.data?.id ?? null;
      const userFirstName = response.data?.first_name ?? response.data?.user?.first_name ?? response.data?.data?.first_name ?? '';
      const userLastName = response.data?.last_name ?? response.data?.user?.last_name ?? response.data?.data?.last_name ?? '';
      const userFullName = [userFirstName, userLastName].filter(Boolean).join(' ').trim();
      setCurrentUserId(userId);
      setConnections(contactsResponse.data?.contacts ?? []);
    } catch (error) {
      console.error('Failed to load current user:', error);
      setConnections([]);
    }
  }, []);

  const handleMentionPick = useCallback((mentionHandle) => {
    if (!allowMentions || !mentionContext) {
      return;
    }

    setDraft((currentDraft) => {
      const safeText = String(currentDraft ?? '');
      const prefix = safeText.slice(0, mentionContext.mentionStart);
      const suffix = safeText.slice(mentionContext.mentionEnd);
      return `${prefix}@${mentionHandle} ${suffix}`;
    });
  }, [allowMentions, mentionContext]);

  const handleMentionPress = useCallback((token) => {
    if (!allowMentions) {
      return;
    }

    const mentionHandle = String(token ?? '').replace(/^@/, '').toLowerCase();

    if (!mentionHandle) {
      return;
    }

    const matchedConnection = connections.find((connection) => {
      const connectionHandle = toMentionHandle(connection?.first_name, connection?.last_name);
      return connectionHandle === mentionHandle;
    });

    if (!matchedConnection?.id) {
      Alert.alert('Mention unavailable', `No profile found for @${mentionHandle}.`);
      return;
    }

    const parentNavigator = navigation.getParent?.();

    if (parentNavigator?.navigate) {
      parentNavigator.navigate('ProfileView', { userId: matchedConnection.id });
      return;
    }

    navigation.navigate('ProfileView', { userId: matchedConnection.id });
  }, [allowMentions, connections, navigation]);

  const loadMessages = useCallback(async () => {
    if (!hasConversation) {
      setMessages([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    try {
      const token = await getAuthToken();
      const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
      const endpoint = isGroup ? `/group-chats/${groupId}/messages` : `/messages/${contactId}`;
      const response = await api.get(endpoint, headers ? { headers } : undefined);
      const messageList = normalizeMessageList(response.data);

      setMessages(messageList);

      if (token) {
        const readEndpoint = isGroup ? `/group-chats/${groupId}/read` : `/messages/${contactId}/read`;
        await api.post(readEndpoint, {}, { headers });
        await refreshUnreadMessages();
      }
    } catch (error) {
      console.error('Failed to load conversation messages:', error);
      setMessages([]);
      Alert.alert('Error', 'Could not load messages.');
    } finally {
      setIsLoading(false);
    }
  }, [contactId, groupId, hasConversation, isGroup, refreshUnreadMessages]);

  useEffect(() => {
    loadCurrentUser();
  }, [loadCurrentUser]);

  useFocusEffect(
    useCallback(() => {
      loadMessages();
    }, [loadMessages])
  );

  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom(false);
    }
  }, [messages, scrollToBottom]);

  const openMessageActions = useCallback((message) => {
    setActionMessage(message);
    setShowActions(true);
  }, []);

  const closeMessageActions = useCallback(() => {
    setShowActions(false);
    setActionMessage(null);
  }, []);

  const handleReact = useCallback(async (emoji) => {
    if (!actionMessage) {
      return;
    }

    try {
      const token = await getAuthToken();
      if (!token) {
        throw new Error('Missing auth token');
      }

      const endpoint = isGroup
        ? `/group-chats/${groupId}/messages/${actionMessage.id}/react`
        : `/messages/${actionMessage.id}/react`;

      await api.post(endpoint, { reaction: emoji }, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setMessages((currentMessages) =>
        currentMessages.map((message) => {
          if (message.id !== actionMessage.id) {
            return message;
          }

          return {
            ...message,
            reactions: {
              ...(message.reactions || {}),
              [emoji]: (message.reactions?.[emoji] || 0) + 1,
            },
          };
        })
      );
    } catch (error) {
      console.error('Failed to react to message:', error);
      Alert.alert('Error', 'Could not add reaction.');
    } finally {
      setShowReactionPicker(false);
      closeMessageActions();
    }
  }, [actionMessage, closeMessageActions, groupId, isGroup]);

  const handleReply = useCallback(() => {
    if (!actionMessage) {
      return;
    }

    setReplyTo({
      ...actionMessage,
      sender_name: actionMessage?.sender_name ?? actionMessage?.sender?.name ?? conversationName,
      isOutgoing: Boolean(actionMessage?.localStatus) || (currentUserId != null && String(actionMessage?.sender_id ?? actionMessage?.user_id ?? actionMessage?.sender?.id ?? '') === String(currentUserId)),
    });
    closeMessageActions();
  }, [actionMessage, closeMessageActions, conversationName, currentUserId]);

  const handleSwipeReply = useCallback((message) => {
    if (!message) {
      return;
    }

    setReplyTo({
      ...message,
      sender_name: message?.sender_name ?? message?.sender?.name ?? conversationName,
      isOutgoing: Boolean(message?.localStatus) || (currentUserId != null && String(message?.sender_id ?? message?.user_id ?? message?.sender?.id ?? '') === String(currentUserId)),
    });
  }, [conversationName, currentUserId]);

  const handleDeleteMessage = useCallback(async () => {
    if (!actionMessage) {
      return;
    }

    try {
      const token = await getAuthToken();
      if (!token) {
        throw new Error('Missing auth token');
      }

      const endpoint = isGroup
        ? `/group-chats/${groupId}/messages/${actionMessage.id}`
        : `/messages/${actionMessage.id}`;

      await api.delete(endpoint, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setMessages((currentMessages) => currentMessages.filter((message) => message.id !== actionMessage.id));
    } catch (error) {
      console.error('Failed to delete message:', error);
      Alert.alert('Error', 'Could not delete message.');
    } finally {
      closeMessageActions();
    }
  }, [actionMessage, closeMessageActions, groupId, isGroup]);

  const handleSend = useCallback(async () => {
    const trimmedDraft = draft.trim();

    if (!trimmedDraft || isSending || !hasConversation) {
      return;
    }

    const temporaryMessageId = `temp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const optimisticMessage = {
      id: temporaryMessageId,
      content: trimmedDraft,
      reply_to: replyTo?.id ?? null,
      sender_id: currentUserId ?? 'local-user',
      created_at: new Date().toISOString(),
      localStatus: 'sending',
    };

    setMessages((currentMessages) => [...currentMessages, optimisticMessage]);
    setDraft('');
    setReplyTo(null);
    setIsSending(true);

    try {
      const endpoint = isGroup ? `/group-chats/${groupId}/messages` : `/messages/${contactId}`;
      const payload = {
        content: trimmedDraft,
        reply_to: replyTo?.id ?? null,
      };

      const response = await api.post(endpoint, payload);

      const sentMessage = response.data?.data ?? response.data?.message ?? response.data;
      const confirmedMessage = sentMessage && typeof sentMessage === 'object'
        ? { ...optimisticMessage, ...sentMessage, localStatus: 'sent' }
        : { ...optimisticMessage, localStatus: 'sent' };

      setMessages((currentMessages) =>
        currentMessages.map((message) => (
          message.id === temporaryMessageId ? confirmedMessage : message
        ))
      );
    } catch (error) {
      console.error('Send failed:', error);
      setMessages((currentMessages) =>
        currentMessages.map((message) => (
          message.id === temporaryMessageId
            ? { ...message, localStatus: 'failed' }
            : message
        ))
      );
      Alert.alert('Failed', 'Message could not be sent.');
    } finally {
      setIsSending(false);
    }
  }, [contactId, draft, groupId, hasConversation, isGroup, isSending, replyTo]);

  const renderMessageItem = useCallback(({ item, index }) => {
    const senderId = item?.sender_id ?? item?.user_id ?? item?.sender?.id ?? item?.sender?.user_id ?? null;
    const isOutgoing = Boolean(item?.localStatus) || (currentUserId != null && senderId != null && String(senderId) === String(currentUserId));
    const senderName = item?.sender?.first_name ?? item?.sender?.name ?? item?.sender_name ?? conversationName;
    const senderAvatar = getAvatarUri(senderName, item?.sender?.alumni_photo ?? item?.sender_avatar ?? conversationAvatar);
    const currentMessageDate = getMessageDate(item);
    const previousMessageDate = getMessageDate(messages[index - 1]);
    const showMessageTime = !isSameMinute(currentMessageDate, previousMessageDate);
    const messageTime = showMessageTime ? formatMessageTime(currentMessageDate) : '';
    const sendStatus = item?.localStatus ?? null;

    return (
      <MessageBubble
        message={item}
        isOutgoing={isOutgoing}
        showAvatar={!isOutgoing}
        senderAvatar={senderAvatar}
        onLongPress={() => openMessageActions(item)}
        onSwipeReply={handleSwipeReply}
        onMentionPress={allowMentions ? handleMentionPress : undefined}
        read={Boolean(item?.read_at)}
        messageTime={messageTime}
        sendStatus={sendStatus}
      />
    );
  }, [allowMentions, conversationAvatar, conversationName, currentUserId, handleMentionPress, handleSwipeReply, messages, openMessageActions]);

  const renderEmptyState = useCallback(() => (
    <View style={styles.emptyConversationState}>
      <Ionicons name="chatbubble-ellipses-outline" size={44} color="#8AA0E8" />
      <Text style={styles.emptyConversationTitle}>Start the conversation</Text>
      <Text style={styles.emptyConversationText}>
        Messages you send here will appear like an Instagram-style chat thread.
      </Text>
    </View>
  ), []);

  if (!hasConversation) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <View style={styles.container}>
          <View style={styles.chatHeader}>
            <Pressable style={styles.headerIconButton} onPress={() => navigation.goBack()} hitSlop={8}>
              <Ionicons name="arrow-back" size={22} color="#31429B" />
            </Pressable>
            <View style={styles.headerProfileWrap}>
              <View style={styles.headerTextWrap}>
                <Text style={styles.headerTitle}>Conversation</Text>
                <Text style={styles.headerSubtitle}>Missing chat details</Text>
              </View>
            </View>
          </View>
          <View style={styles.loadingState}>
            <Text style={styles.emptyConversationTitle}>No conversation selected</Text>
            <Text style={styles.emptyConversationText}>
              Open this screen from a contact or message thread.
            </Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <CustomKeyboardView
        footer={(
          <View style={styles.composerFooterWrap}>
            {mentionContext && mentionSuggestions.length > 0 ? (
              <View style={styles.mentionPanel}>
                {mentionSuggestions.map((item) => (
                  <Pressable
                    key={String(item.id ?? item.name)}
                    style={styles.mentionItem}
                    onPress={() => handleMentionPick(item.handle)}
                  >
                    <Image source={{ uri: item.avatar }} style={styles.mentionAvatar} />
                    <Text style={styles.mentionName} numberOfLines={1}>@{item.handle}</Text>
                  </Pressable>
                ))}
              </View>
            ) : null}

            <MessageInputBar
              value={draft}
              onChangeText={setDraft}
              onSend={handleSend}
              onAttach={() => Alert.alert('Attachments', 'Attachment picker is not implemented yet.')}
              onEmoji={() => setDraft((currentDraft) => `${currentDraft} 😊`)}
              disabled={isSending}
              isReplying={Boolean(replyTo)}
              onCancelReply={() => setReplyTo(null)}
              replyTo={replyTo}
            />
          </View>
        )}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <View style={styles.container}>
            <ChatHeader
              title={conversationName}
              subtitle={headerSubtitle}
              avatarUri={getAvatarUri(conversationName, conversationAvatar)}
              onBackPress={() => navigation.goBack()}
              onProfilePress={() => {}}
              onCallPress={() => {}}
              onVideoPress={() => {}}
              onInfoPress={() => {
                navigation.navigate('ChatDetailsScreen', {
                  group: {
                    id: groupId,
                    name: conversationName,
                    avatar: getAvatarUri(conversationName, conversationAvatar),
                    members: isGroup ? groupMembers : [],
                    media: [],
                  },
                });
              }}
            />

            <FlatList
              ref={flatListRef}
              data={messages}
              renderItem={renderMessageItem}
              keyExtractor={(item, index) => String(item?.id ?? index)}
              contentContainerStyle={messages.length > 0 ? styles.messagesContent : [styles.messagesContent, { flexGrow: 1 }]}
              ListEmptyComponent={renderEmptyState}
              keyboardShouldPersistTaps="handled"
              onLayout={() => scrollToBottom(false)}
              onContentSizeChange={() => scrollToBottom(false)}
              showsVerticalScrollIndicator={false}
              style={styles.chatBody}
            />

            <Modal
              visible={showActions}
              transparent
              animationType="fade"
              onRequestClose={closeMessageActions}
            >
              <View style={styles.reactionPickerOverlay}>
                <View style={styles.reactionPickerContent}>
                  <Text style={styles.reactionPickerTitle}>Message actions</Text>

                  <TouchableOpacity style={styles.reactionPickerEmoji} onPress={handleReply}>
                    <Text style={styles.reactionPickerEmojiText}>Reply</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.reactionPickerEmoji} onPress={() => setShowReactionPicker(true)}>
                    <Text style={styles.reactionPickerEmojiText}>React</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.reactionPickerEmoji} onPress={handleDeleteMessage}>
                    <Text style={styles.reactionPickerEmojiText}>Delete</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.reactionPickerClose} onPress={closeMessageActions}>
                    <Text style={styles.reactionPickerCloseText}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Modal>

            <Modal
              visible={showReactionPicker}
              transparent
              animationType="fade"
              onRequestClose={() => setShowReactionPicker(false)}
            >
              <View style={styles.reactionPickerOverlay}>
                <View style={styles.reactionPickerContent}>
                  <Text style={styles.reactionPickerTitle}>React to message</Text>
                  <View style={styles.reactionPickerRow}>
                    {REACTIONS.map((emoji) => (
                      <TouchableOpacity
                        key={emoji}
                        style={styles.reactionPickerEmoji}
                        onPress={() => handleReact(emoji)}
                      >
                        <Text style={styles.reactionPickerEmojiText}>{emoji}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  <TouchableOpacity style={styles.reactionPickerClose} onPress={() => setShowReactionPicker(false)}>
                    <Text style={styles.reactionPickerCloseText}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Modal>
          </View>
        </TouchableWithoutFeedback>
      </CustomKeyboardView>
    </SafeAreaView>
  );
}

const localStyles = StyleSheet.create({
  attachmentImage: {
    width: Math.min(SCREEN_WIDTH * 0.72, 280),
    height: Math.min(SCREEN_WIDTH * 0.72, 280),
    borderRadius: 14,
    marginBottom: 8,
    backgroundColor: '#E5E7EB',
  },
  messageAvatarSpacer: {
    width: 24,
    height: 24,
    marginRight: 8,
  },
  messageColumn: {
    flexShrink: 1,
    maxWidth: '76%',
  },
  bottomSafeArea: {
    backgroundColor: 'transparent',
  },
  seenText: {
    marginLeft: 8,
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
});
