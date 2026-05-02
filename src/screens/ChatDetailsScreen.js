import React, { useMemo } from 'react';
import { Dimensions, View, Text, Image, StyleSheet, FlatList, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const getAvatarUri = (name, avatarUri) => {
  if (avatarUri) {
    return avatarUri;
  }
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'Member')}&background=31429B&color=fff`;
};

const ChatDetailsScreen = ({ route, navigation }) => {
  // Extract route params
  const routeContact = route?.params?.contact;
  const routeGroup = route?.params?.group;
  const dmProfileUserId = routeContact?.id ?? routeContact?.alumni_id ?? null;

  // Determine view type based on what was passed

  // Render DM view
  if (routeContact) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <View style={styles.container}>
          <View style={styles.headerTopRow}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="chevron-back" size={24} color="#1F2937" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.dmContainer} showsVerticalScrollIndicator={false}>
            <View style={styles.dmCenterHeader}>
              <Image 
                source={{ uri: getAvatarUri(routeContact?.name ?? routeContact?.first_name, routeContact?.avatar ?? routeContact?.alumni_photo) }} 
                style={styles.bigAvatar} 
              />
              <Text style={styles.dmName}>
                {routeContact?.name ?? (`${routeContact?.first_name ?? ''} ${routeContact?.last_name ?? ''}`.trim() || 'Alumni')}
              </Text>
              {routeContact?.username ? <Text style={styles.dmUsername}>@{routeContact.username}</Text> : null}

              <View style={styles.dmActionsRow}>
                <TouchableOpacity 
                  style={styles.dmActionButton} 
                  onPress={() => { /* TODO: audio call */ }}
                >
                  <Ionicons name="call-outline" size={22} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.dmActionButton, styles.dmActionSecondary]} 
                  onPress={() => { /* TODO: video call */ }}
                >
                  <Ionicons name="videocam-outline" size={22} color="#31429B" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.dmActionButton, styles.dmActionSecondary]}
                  onPress={() => {
                    if (dmProfileUserId) {
                      navigation.navigate('Home', {
                        screen: 'ProfileView',
                        params: { userId: dmProfileUserId },
                      });
                    }
                  }}
                >
                  <Ionicons name="person-outline" size={22} color="#31429B" />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.dmOptionsList}>
              <TouchableOpacity 
                style={styles.dmOptionRow} 
                onPress={() => navigation.navigate('SearchMessage', { contactId: routeContact?.id })}
              >
                <Ionicons name="search-outline" size={18} color="#31429B" />
                <Text style={styles.dmOptionText}>Search in conversation</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.dmOptionRow} 
                onPress={() => { /* TODO: toggle notifications */ }}
              >
                <Ionicons name="notifications-outline" size={18} color="#31429B" />
                <Text style={styles.dmOptionText}>Mute messages</Text>
              </TouchableOpacity>

              <View style={styles.dmDivider} />

              <TouchableOpacity 
                style={[styles.dmOptionRow, styles.dmDestructive]} 
                onPress={() => { /* TODO: block */ }}
              >
                <Ionicons name="close-circle-outline" size={18} color="#DC2626" />
                <Text style={[styles.dmOptionText, { color: '#DC2626' }]}>Block</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.dmOptionRow, styles.dmDestructive]} 
                onPress={() => { /* TODO: report */ }}
              >
                <Ionicons name="flag-outline" size={18} color="#DC2626" />
                <Text style={[styles.dmOptionText, { color: '#DC2626' }]}>Report</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </SafeAreaView>
    );
  }

  // Render Group view
  const groupData = routeGroup || {
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

  const normalizedMembers = useMemo(() => {
    const rawMembers = Array.isArray(groupData?.members) ? groupData.members : [];

    return rawMembers.map((member, index) => {
      const firstName = member?.first_name ?? member?.admin_first_name ?? '';
      const lastName = member?.last_name ?? member?.admin_last_name ?? '';
      const fallbackName = [firstName, lastName].filter(Boolean).join(' ').trim();
      const fullName = (member?.name ?? fallbackName) || 'Member';
      const avatar = member?.avatar
        ?? member?.photo
        ?? member?.alumni_photo
        ?? member?.profile_photo
        ?? null;

      return {
        id: member?.id ?? member?.alumni_id ?? member?.member_id ?? index,
        name: fullName,
        avatar: getAvatarUri(fullName, avatar),
      };
    });
  }, [groupData?.members]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.container}>
        <View style={styles.headerTopRow}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="chevron-back" size={24} color="#1F2937" />
          </TouchableOpacity>
        </View>

        <View style={styles.header}>
          <Image source={{ uri: getAvatarUri(groupData?.name, groupData?.avatar) }} style={styles.avatar} />
          <Text style={styles.name}>{groupData?.name || 'Group Chat'}</Text>
        </View>

        <Text style={styles.sectionTitle}>Members</Text>
        {normalizedMembers.length > 0 ? (
          <FlatList
            data={normalizedMembers}
            keyExtractor={(item) => String(item.id)}
            renderItem={({ item }) => (
              <View style={styles.memberRow}>
                <Image source={{ uri: item.avatar }} style={styles.memberAvatar} />
                <Text style={styles.memberName} numberOfLines={1}>{item.name}</Text>
              </View>
            )}
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ marginBottom: 12 }}
          />
        ) : (
          <Text style={styles.emptyText}>No members found for this group chat.</Text>
        )}

        <Text style={styles.sectionTitle}>Shared Media</Text>
        <FlatList
          data={groupData?.media ?? []}
          keyExtractor={(item, index) => String(item?.id ?? index)}
          renderItem={({ item }) => (
            <Image source={{ uri: item?.uri }} style={styles.mediaImage} />
          )}
          horizontal
        />

        <TouchableOpacity style={styles.leaveBtn}>
          <Ionicons name="exit-outline" size={18} color="#E57373" />
          <Text style={styles.leaveBtnText}>Leave Group</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#fff' },
  container: { flex: 1, backgroundColor: '#fff', padding: Math.max(14, Math.min(20, SCREEN_WIDTH * 0.04)) },
  header: { alignItems: 'center', marginBottom: Math.max(14, Math.min(22, SCREEN_HEIGHT * 0.024)) },
  backButton: { position: 'absolute', left: 0, top: 0, zIndex: 2, padding: 4 },
  avatar: { width: Math.max(64, Math.min(84, SCREEN_WIDTH * 0.18)), height: Math.max(64, Math.min(84, SCREEN_WIDTH * 0.18)), borderRadius: Math.max(32, Math.min(42, SCREEN_WIDTH * 0.09)), marginBottom: 8 },
  name: { fontWeight: 'bold', fontSize: Math.max(18, Math.min(22, SCREEN_WIDTH * 0.05)), color: '#222' },
  sectionTitle: { fontWeight: 'bold', color: '#31429B', marginTop: 16, marginBottom: 6, fontSize: Math.max(14, Math.min(16, SCREEN_WIDTH * 0.04)) },
  memberRow: { alignItems: 'center', marginRight: 16 },
  memberAvatar: { width: Math.max(36, Math.min(44, SCREEN_WIDTH * 0.1)), height: Math.max(36, Math.min(44, SCREEN_WIDTH * 0.1)), borderRadius: Math.max(18, Math.min(22, SCREEN_WIDTH * 0.05)), marginBottom: 4 },
  memberName: { fontSize: Math.max(12, Math.min(14, SCREEN_WIDTH * 0.034)), color: '#222' },
  emptyText: { fontSize: 13, color: '#6B7280', marginBottom: 12 },
  mediaImage: { width: Math.max(56, Math.min(80, SCREEN_WIDTH * 0.18)), height: Math.max(56, Math.min(80, SCREEN_WIDTH * 0.18)), borderRadius: 8, marginRight: 8 },
  leaveBtn: { flexDirection: 'row', alignItems: 'center', marginTop: 32, alignSelf: 'center', paddingHorizontal: 10, paddingVertical: 8 },
  leaveBtnText: { color: '#E57373', fontWeight: 'bold', marginLeft: 6, fontSize: Math.max(14, Math.min(16, SCREEN_WIDTH * 0.036)) },
  /* DM / Instagram-like styles */
  headerTopRow: { height: 44, justifyContent: 'center' },
  dmContainer: { flexGrow: 1 },
  dmCenterHeader: { alignItems: 'center', marginTop: 12, marginBottom: 20, paddingVertical: 12 },
  bigAvatar: { width: Math.max(120, Math.min(160, SCREEN_WIDTH * 0.36)), height: Math.max(120, Math.min(160, SCREEN_WIDTH * 0.36)), borderRadius: Math.max(60, Math.min(80, SCREEN_WIDTH * 0.18)), marginBottom: 12 },
  dmName: { fontWeight: '800', fontSize: Math.max(18, Math.min(22, SCREEN_WIDTH * 0.06)), color: '#111827' },
  dmUsername: { color: '#6B7280', marginTop: 4, fontSize: 14 },
  dmActionsRow: { flexDirection: 'row', alignItems: 'center', marginTop: 16, gap: 12 },
  dmActionButton: { width: 54, height: 54, borderRadius: 27, backgroundColor: '#31429B', alignItems: 'center', justifyContent: 'center' },
  dmActionSecondary: { backgroundColor: '#EEF2FF' },
  dmOptionsList: { borderTopWidth: 1, borderTopColor: '#E5E7EB', paddingTop: 0 },
  dmOptionRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  dmOptionText: { marginLeft: 12, fontSize: 15, color: '#111827', fontWeight: '500' },
  dmDivider: { height: 8, backgroundColor: '#F9FAFB', marginVertical: 4 },
  dmDestructive: { borderBottomColor: '#FEE2E2' },
});

export default ChatDetailsScreen;
