import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, AppState, FlatList, Image, KeyboardAvoidingView, Platform, Pressable, Text, View, TouchableOpacity, Modal, Keyboard } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRoute, useIsFocused } from '@react-navigation/native';
import api from '../services/api';
import { getAuthToken } from '../services/authStorage';
import { supabase } from '../services/supabaseClient';
import styles from '../styles/ConvoScreen.styles';
import MessageBubble from '../components/MessageBubble';
import MessageInputBar from '../components/MessageInputBar';

const ConvoScreen = ({ navigation, route }) => {
  // --- STATE VARIABLES ---
  const [replyTo, setReplyTo] = useState(null);
  const [showMessageActions, setShowMessageActions] = useState(false);
  const [actionMessage, setActionMessage] = useState(null);
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [selectedMessageId, setSelectedMessageId] = useState(null);
  const [showAttachmentModal, setShowAttachmentModal] = useState(false);
  const [attachment, setAttachment] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [messageDraft, setMessageDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [contactStatus, setContactStatus] = useState('');

  const typingTimeout = useRef(null);
  const REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '👏'];

  // Support both DM and group chat
  const groupId = route?.params?.groupId;
  const groupName = route?.params?.groupName;
  const groupAvatar = route?.params?.groupAvatar;
  const groupMembers = route?.params?.groupMembers || [];
  const isGroup = !!groupId;

  // --- ACTION HANDLERS ---
  const handleAddReaction = async (messageId, reaction) => {
    try {
      const token = await getAuthToken();
      if (!token) return;
      let url = isGroup ? `/group-chats/${groupId}/messages/${messageId}/react` : `/messages/${messageId}/react`;
      await api.post(url, { reaction }, { headers: { Authorization: `Bearer ${token}` } });
      setMessages((msgs) =>
        msgs.map((msg) =>
          msg.id === messageId
            ? { ...msg, reactions: { ...(msg.reactions || {}), [reaction]: (msg.reactions?.[reaction] || 0) + 1 } }
            : msg
        )
      );
    } catch {}
    setShowReactionPicker(false);
    setSelectedMessageId(null);
  };

  const openMessageActions = (message) => {
    setActionMessage(message);
    setShowMessageActions(true);
  };

  const openReactionPicker = (messageId) => {
    setSelectedMessageId(messageId);
    setShowReactionPicker(true);
    setShowMessageActions(false);
  };

  const handleReply = (message) => {
    setReplyTo(message);
    setShowMessageActions(false);
  };

  const handleUnsend = async (message) => {
    try {
      const token = await getAuthToken();
      if (!token) return;
      let url = isGroup ? `/group-chats/${groupId}/messages/${message.id}` : `/messages/${message.id}`;
      await api.delete(url, { headers: { Authorization: `Bearer ${token}` } });
      setMessages((msgs) => msgs.filter((msg) => msg.id !== message.id));
    } catch {}
    setShowMessageActions(false);
  };

  const handleForward = (message) => {
    setMessageDraft(message.content);
    setShowMessageActions(false);
  };

  // --- EFFECTS ---
  // Mark messages as read when loaded
  useEffect(() => {
    if (!messages.length) return;
    (async () => {
      try {
        const token = await getAuthToken();
        if (!token) return;
        let url = isGroup ? `/group-chats/${groupId}/read` : `/messages/${route?.params?.contactId}/read`;
        await api.post(url, {}, { headers: { Authorization: `Bearer ${token}` } });
      } catch {}
    })();
  }, [messages, isGroup, groupId, route?.params?.contactId]);

  // Fetch user presence (online/last seen)
  useEffect(() => {
    let isMounted = true;
    const fetchPresence = async () => {
      try {
        const token = await getAuthToken();
        if (!token) return;
        let url = isGroup ? `/group-chats/${groupId}/presence` : `/users/${route?.params?.contactId}/presence`;
        const response = await api.get(url, { headers: { Authorization: `Bearer ${token}` } });
        if (isMounted) setContactStatus(response.data?.status || '');
      } catch {
        if (isMounted) setContactStatus('');
      }
    };
    fetchPresence();
    return () => { isMounted = false; };
  }, [isGroup, groupId, route?.params?.contactId]);

  // Broadcast typing event
  const broadcastTyping = useCallback(async () => {
    try {
      const token = await getAuthToken();
      if (!token) return;
      let url = isGroup ? `/group-chats/${groupId}/typing` : `/messages/${route?.params?.contactId}/typing`;
      await api.post(url, {}, { headers: { Authorization: `Bearer ${token}` } });
    } catch {}
  }, [isGroup, groupId, route?.params?.contactId]);

  // Listen for typing events (Supabase real-time)
  useEffect(() => {
    let channel;
    if (typeof supabase !== 'undefined') {
      channel = supabase
        .channel(isGroup ? `public:group_typing:${groupId}` : 'public:typing')
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: isGroup ? 'group_typing' : 'typing' },
          (payload) => {
            setIsTyping(true);
            if (typingTimeout.current) clearTimeout(typingTimeout.current);
            typingTimeout.current = setTimeout(() => setIsTyping(false), 2500);
          }
        )
        .subscribe();
    }
    return () => {
      if (channel && typeof supabase !== 'undefined') supabase.removeChannel(channel);
      if (typingTimeout.current) clearTimeout(typingTimeout.current);
    };
  }, [isGroup, groupId, route?.params?.contactId]);

  // Fetch Messages & Listen for Real-time inserts
  useEffect(() => {
    let isMounted = true;
    const fetchMessages = async () => {
      setLoading(true);
      try {
        const token = await getAuthToken();
        if (!token) return;
        let url = isGroup ? `/group-chats/${groupId}/messages` : `/messages/${route?.params?.contactId}`;
        const response = await api.get(url, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (isMounted) setMessages(response.data?.messages || []);
      } catch {
        if (isMounted) setMessages([]);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchMessages();

    let channel;
    if (typeof supabase !== 'undefined') {
      channel = supabase
        .channel(isGroup ? `public:group_messages:${groupId}` : 'public:messages')
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: isGroup ? 'group_messages' : 'messages' },
          (payload) => {
            const newMessage = payload.new;
            if ((isGroup && newMessage.group_id === groupId) || (!isGroup && (newMessage.sender_id === route?.params?.contactId || newMessage.receiver_id === route?.params?.contactId))) {
              setMessages((msgs) => {
                if (msgs.some((msg) => msg.id === newMessage.id)) return msgs;
                return [...msgs, newMessage];
              });
            }
          }
        )
        .subscribe();
    }
    return () => {
      isMounted = false;
      if (channel && typeof supabase !== 'undefined') supabase.removeChannel(channel);
    };
  }, [isGroup, groupId, route?.params?.contactId]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <KeyboardAvoidingView
        style={[styles.chatScreen, { flex: 1 }]}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={[styles.container, { flex: 1 }]}> 
          {/* Header */}
          <View style={styles.chatHeader}>
            <Pressable style={styles.headerIconButton} onPress={() => navigation.goBack()} hitSlop={8}>
              <Ionicons name="arrow-back" size={22} color="#7CEBFF" />
            </Pressable>
            <TouchableOpacity style={styles.headerProfileWrap}>
              <Image source={{ uri: isGroup ? (groupAvatar || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(groupName || 'Group') + '&background=31429B&color=fff') : 'https://randomuser.me/api/portraits/men/2.jpg' }} style={styles.headerAvatar} />
              <View style={styles.headerTextWrap}>
                <Text style={styles.headerTitle} numberOfLines={1}>{isGroup ? groupName : 'Direct Message'}</Text>
                {isGroup ? (
                  <Text style={styles.headerSubtitle} numberOfLines={1}>
                    {groupMembers.map((m) => m.name).join(', ')}
                  </Text>
                ) : (
                  <Text style={styles.headerSubtitle} numberOfLines={1}>{contactStatus || 'Active now'}</Text>
                )}
              </View>
            </TouchableOpacity>
            <View style={styles.headerActions}>
              <Pressable style={styles.headerIconButton} hitSlop={8}>
                <Ionicons name="call-outline" size={22} color="#31429B" />
              </Pressable>
              <Pressable style={styles.headerIconButton} hitSlop={8}>
                <Ionicons name="videocam-outline" size={22} color="#31429B" />
              </Pressable>
              <Pressable style={styles.headerIconButton} hitSlop={8} onPress={() => navigation.navigate('ChatDetailsScreen', { groupId, groupName, groupAvatar, groupMembers }) }>
                <Ionicons name="information-circle-outline" size={24} color="#31429B" />
              </Pressable>
            </View>
          </View>

          {/* Chat body */}
          <View style={styles.chatBody}>
            <Image source={{ uri: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80' }} style={styles.chatBackground} resizeMode="cover" />
            <View style={styles.messagesArea}>
              {loading ? (
                <View style={styles.loadingState}><ActivityIndicator color="#31429B" /></View>
              ) : (
                <FlatList
                  data={messages}
                  renderItem={({ item }) => (
                    <MessageBubble
                      message={item}
                      isOutgoing={false} // TODO: set true if current user is sender
                      showAvatar={isGroup}
                      senderAvatar={item.sender_avatar || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(item.sender_name || 'User') + '&background=31429B&color=fff'}
                      senderName={item.sender_name}
                      isGroup={isGroup}
                      onLongPress={() => openMessageActions(item)}
                      read={!!item.read_at}
                    />
                  )}
                  keyExtractor={(item) => String(item.id)}
                  style={styles.messagesScroll}
                  contentContainerStyle={styles.messagesContent}
                  showsVerticalScrollIndicator={false}
                />
              )}
            </View>
            
            {/* Typing indicator */}
            {isTyping && (
              <View style={styles.typingIndicatorRow}><View style={styles.typingBubble}><Text style={styles.typingText}>Someone is typing...</Text></View></View>
            )}

            {/* Composer */}
            <View style={styles.composerWrap}>
              <MessageInputBar
                value={messageDraft}
                onChangeText={(text) => {
                  setMessageDraft(text);
                  if (typingTimeout.current) clearTimeout(typingTimeout.current);
                  broadcastTyping();
                  typingTimeout.current = setTimeout(() => setIsTyping(false), 2500);
                }}
                onSend={async () => {
                  if ((!messageDraft.trim() && !attachment) || sending) return;
                  setSending(true);
                  try {
                    const token = await getAuthToken();
                    if (!token) return;
                    let url = isGroup ? `/group-chats/${groupId}/messages` : `/messages/${route?.params?.contactId}`;
                    const payload = { content: messageDraft.trim(), attachment: attachment?.uri || null, reply_to: replyTo?.id || null };
                    const response = await api.post(url, payload, { headers: { Authorization: `Bearer ${token}` } });
                    const sentMessage = response.data?.data || response.data?.message || response.data;
                    setMessages((msgs) => [...msgs, sentMessage]);
                    setMessageDraft('');
                    setAttachment(null);
                    setReplyTo(null);
                  } catch {}
                  setSending(false);
                }}
                onAttach={() => setShowAttachmentModal(true)}
                onEmoji={() => setMessageDraft((d) => d + '😊')}
                isReplying={!!replyTo}
                replyTo={replyTo}
                onCancelReply={() => setReplyTo(null)}
                disabled={sending}
              />
              
              {/* Message actions modal */}
              <Modal
                visible={showMessageActions}
                transparent
                animationType="fade"
                onRequestClose={() => setShowMessageActions(false)}
              >
                <View style={styles.reactionPickerOverlay}>
                  <View style={styles.reactionPickerContent}>
                    <Text style={styles.reactionPickerTitle}>Message actions</Text>
                    <TouchableOpacity style={styles.reactionPickerEmoji} onPress={() => handleReply(actionMessage)}>
                      <Text style={styles.reactionPickerEmojiText}>Reply</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.reactionPickerEmoji} onPress={() => handleUnsend(actionMessage)}>
                      <Text style={styles.reactionPickerEmojiText}>Unsend</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.reactionPickerEmoji} onPress={() => handleForward(actionMessage)}>
                      <Text style={styles.reactionPickerEmojiText}>Forward</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.reactionPickerEmoji} onPress={() => openReactionPicker(actionMessage?.id)}>
                      <Text style={styles.reactionPickerEmojiText}>React</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.reactionPickerClose} onPress={() => setShowMessageActions(false)}>
                      <Text style={styles.reactionPickerCloseText}>Cancel</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </Modal>

              {/* Show attachment preview */}
              {attachment && (
                <View style={styles.attachmentPreview}>
                  {attachment.type === 'image' ? (
                    <Image source={{ uri: attachment.uri }} style={styles.attachmentPreviewImage} />
                  ) : (
                    <View style={styles.attachmentPreviewFile}>
                      <Ionicons name="document-outline" size={20} color="#31429B" />
                      <Text style={styles.attachmentPreviewFileText}>File attached</Text>
                    </View>
                  )}
                  <TouchableOpacity onPress={() => setAttachment(null)} style={styles.attachmentPreviewRemove}>
                    <Ionicons name="close-circle" size={20} color="#E57373" />
                  </TouchableOpacity>
                </View>
              )}

              {/* Attachment modal */}
              <Modal
                visible={showAttachmentModal}
                transparent
                animationType="slide"
                onRequestClose={() => setShowAttachmentModal(false)}
              >
                <View style={styles.attachmentModalOverlay}>
                  <View style={styles.attachmentModalContent}>
                    <Text style={styles.attachmentModalTitle}>Attach a file</Text>
                    <TouchableOpacity
                      style={styles.attachmentOption}
                      onPress={() => {
                        setAttachment({ uri: 'https://placekitten.com/200/200', type: 'image' });
                        setShowAttachmentModal(false);
                      }}
                    >
                      <Ionicons name="image-outline" size={24} color="#31429B" />
                      <Text style={styles.attachmentOptionText}>Image (mock)</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.attachmentOption}
                      onPress={() => {
                        setAttachment({ uri: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', type: 'file' });
                        setShowAttachmentModal(false);
                      }}
                    >
                      <Ionicons name="document-outline" size={24} color="#31429B" />
                      <Text style={styles.attachmentOptionText}>File (mock)</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.attachmentModalClose} onPress={() => setShowAttachmentModal(false)}>
                      <Text style={styles.attachmentModalCloseText}>Cancel</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </Modal>

              {/* Reaction picker modal */}
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
                          onPress={() => handleAddReaction(selectedMessageId, emoji)}
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
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default ConvoScreen;