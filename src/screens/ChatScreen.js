import React, { useCallback, useMemo, useState } from 'react';
import {
	View,
	Text,
	Image,
	TouchableOpacity,
	useWindowDimensions,
	FlatList,
	ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import api from '../services/api';
import BrandHeader from '../components/BrandHeader';
import styles from '../styles/ChatScreen.styles';
import { getAuthToken } from '../services/authStorage';

const CONTACTS_CACHE_TTL_MS = 15000;
let cachedContacts = null;
let cachedContactsLoadedAt = 0;

const getCachedContacts = () => {
	if (!cachedContacts) {
		return null;
	}

	if (Date.now() - cachedContactsLoadedAt > CONTACTS_CACHE_TTL_MS) {
		cachedContacts = null;
		cachedContactsLoadedAt = 0;
		return null;
	}

	return cachedContacts;
};

const TABS = [
	{ key: 'all', label: 'All Chats' },
	{ key: 'channels', label: 'Channels' },
	{ key: 'favorites', label: 'Favorites' },
];

const ChatScreen = ({ navigation }) => {
	// SECTION: Layout values
	const { width } = useWindowDimensions();
	const isCompactWidth = width < 375;
	const isTablet = width >= 768;
	const layout = {
		headerLogoWidth: isTablet ? 176 : isCompactWidth ? 124 : 146,
		headerLogoHeight: isTablet ? 44 : isCompactWidth ? 32 : 36,
		avatarSize: isTablet ? 46 : isCompactWidth ? 34 : 38,
		actionSize: isTablet ? 46 : isCompactWidth ? 38 : 40,
		contentPadding: isCompactWidth ? 14 : 16,
	};

	const [selectedTab, setSelectedTab] = useState('all');
	const [userData, setUserData] = useState(null);
	const [contacts, setContacts] = useState([]);
	const [admins, setAdmins] = useState([]);
	const [isLoadingAdmins, setIsLoadingAdmins] = useState(false);
	const [groupChats, setGroupChats] = useState([]);
	const [isLoadingChatData, setIsLoadingChatData] = useState(false);

	// HANDLER: Open the search screen
	const openSearchMessage = () => {
		const parentNavigator = navigation.getParent?.();

		if (parentNavigator?.navigate) {
			parentNavigator.navigate('SearchMessage');
			return;
		}

		navigation.navigate('SearchMessage');
	};

	// HANDLER: Open the new message screen
	const openNewMessage = () => {
		const parentNavigator = navigation.getParent?.();

		if (parentNavigator?.navigate) {
			parentNavigator.navigate('NewMessage');
			return;
		}

		navigation.navigate('NewMessage');
	};

	const openConversation = (contact) => {
		const contactName = `${contact?.first_name ?? ''} ${contact?.last_name ?? ''}`.trim() || 'Alumni';
		const contactAvatar = contact?.alumni_photo
			? contact.alumni_photo
			: `https://ui-avatars.com/api/?name=${encodeURIComponent(contactName)}&background=31429B&color=fff`;
		const parentNavigator = navigation.getParent?.();

		if (parentNavigator?.navigate) {
			parentNavigator.navigate('ConvoScreen', {
				contactId: contact?.id,
				contactName,
				contactAvatar,
			});
			return;
		}

		navigation.navigate('ConvoScreen', {
			contactId: contact?.id,
			contactName,
			contactAvatar,
		});
	};

	const openGroupConversation = (groupChat) => {
		const groupName = groupChat?.name ?? 'Group Chat';
		const groupAvatar = groupChat?.avatar_url
			? groupChat.avatar_url
			: `https://ui-avatars.com/api/?name=${encodeURIComponent(groupName)}&background=31429B&color=fff`;
		const groupMembers = Array.isArray(groupChat?.members) ? groupChat.members : [];
		const parentNavigator = navigation.getParent?.();

		const conversationParams = {
			groupId: groupChat?.id,
			groupName,
			groupAvatar,
			groupMembers,
		};

		if (parentNavigator?.navigate) {
			parentNavigator.navigate('ConvoScreen', conversationParams);
			return;
		}

		navigation.navigate('ConvoScreen', conversationParams);
	};

	const loadChatData = useCallback(async () => {
		try {
			setIsLoadingChatData(true);
			setIsLoadingAdmins(true);
			const token = await getAuthToken();

			if (!token) {
				setUserData(null);
				setContacts([]);
				setGroupChats([]);
				return;
			}

			const headers = { Authorization: `Bearer ${token}` };
			const cachedContactsResponse = getCachedContacts();
			const userRequest = api.get('/user', { headers });
			const contactsRequest = cachedContactsResponse
				? Promise.resolve({ data: { contacts: cachedContactsResponse } })
				: api.get('/contacts', { headers });
			const groupChatsRequest = api.get('/group-chats', { headers });

			// attempt to load admins as well; backend may return different shapes
			const adminsRequest = api.get('/admins', { headers }).catch(() => ({ data: { admins: [] } }));

			const [userResponse, contactsResponse, groupChatsResponse, adminsResponse] = await Promise.all([
				userRequest,
				contactsRequest,
				groupChatsRequest,
				adminsRequest,
			]);

			setUserData(userResponse.data);
			const nextContacts = contactsResponse.data?.contacts ?? [];
			setContacts(nextContacts);
			const nextGroupChats = groupChatsResponse.data?.group_chats ?? groupChatsResponse.data?.groups ?? [];
			setGroupChats(nextGroupChats);
			const nextAdmins = adminsResponse.data?.admins ?? adminsResponse.data ?? [];
			setAdmins(nextAdmins);

			if (!cachedContactsResponse) {
				cachedContacts = nextContacts;
				cachedContactsLoadedAt = Date.now();
			}
		} catch (error) {
			console.error('Failed to fetch chat screen data:', error);
			setUserData(null);
			setContacts([]);
			setGroupChats([]);
		} finally {
			setIsLoadingChatData(false);
			setIsLoadingAdmins(false);
		}
	}, []);

	useFocusEffect(
		useCallback(() => {
			void loadChatData();
		}, [loadChatData])
	);

	// DERIVED VALUE: Display name
	const displayName = useMemo(() => {
		if (!userData) {
			return 'Alumni User';
		}
		return `${userData.first_name ?? ''}`.trim() || 'Alumni User';
	}, [userData]);

	// DERIVED VALUE: Avatar URI
	const avatarUri = useMemo(() => {
		if (userData?.alumni_photo) {
			return userData.alumni_photo;
		}
		return `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=31429B&color=fff`;
	}, [displayName, userData]);

	const activeChats = useMemo(() => {
		if (selectedTab === 'channels') {
			return groupChats.map((groupChat) => ({ ...groupChat, __chatType: 'group' }));
		}

		if (selectedTab === 'favorites') {
			return contacts
				.filter((item) => item?.is_favorite || item?.favorite || item?.is_starred)
				.map((contact) => ({ ...contact, __chatType: 'contact' }));
		}

		const mergedChats = [
			...groupChats.map((groupChat) => ({ ...groupChat, __chatType: 'group' })),
			...contacts.map((contact) => ({ ...contact, __chatType: 'contact' })),
		];

		return mergedChats.sort((firstItem, secondItem) => {
			const firstTimestamp = new Date(
				firstItem?.updated_at
					?? firstItem?.latest_message?.created_at
					?? firstItem?.created_at
					?? 0
			).getTime();
			const secondTimestamp = new Date(
				secondItem?.updated_at
					?? secondItem?.latest_message?.created_at
					?? secondItem?.created_at
					?? 0
			).getTime();

			return secondTimestamp - firstTimestamp;
		});
	}, [contacts, groupChats, selectedTab]);

	const renderEmptyState = useCallback((title, description) => {
		return (
			<View style={styles.emptyWrap}>
				<Text style={styles.emptyTitle}>{title}</Text>
				<Text style={styles.emptyText}>{description}</Text>
			</View>
		);
	}, []);

	const renderContactItem = ({ item }) => {
		const contactName = `${item?.first_name ?? ''} ${item?.last_name ?? ''}`.trim() || 'Alumni';
		const contactAvatar = item?.alumni_photo
			? item.alumni_photo
			: `https://ui-avatars.com/api/?name=${encodeURIComponent(contactName)}&background=31429B&color=fff`;
		const hasUnread = item?.is_read === false;

		return (
			<TouchableOpacity
				style={styles.contactCard}
				activeOpacity={0.85}
				onPress={() => openConversation(item)}
			>
				<Image source={{ uri: contactAvatar }} style={styles.contactAvatar} />
				<View style={styles.contactTextWrap}>
					<Text style={styles.contactName} numberOfLines={1}>{contactName}</Text>
					<Text style={styles.contactMeta}>Connected</Text>
				</View>
				<View style={styles.contactRightWrap}>
					{hasUnread ? <View style={styles.contactUnreadIndicator} /> : null}
					<Ionicons name="chevron-forward" size={18} color="#8A94A6" />
				</View>
			</TouchableOpacity>
		);
	};

	const renderGroupChatItem = ({ item }) => {
		const groupName = item?.name ?? 'Group Chat';
		const groupAvatar = item?.avatar_url
			? item.avatar_url
			: `https://ui-avatars.com/api/?name=${encodeURIComponent(groupName)}&background=31429B&color=fff`;
		const latestMessage = item?.latest_message?.content ?? 'No messages yet';
		const memberCount = Array.isArray(item?.members) ? item.members.length : 0;
		const unreadCount = Number(item?.unread_count ?? 0);

		return (
			<TouchableOpacity
				style={styles.groupCard}
				activeOpacity={0.85}
				onPress={() => openGroupConversation(item)}
			>
				<Image source={{ uri: groupAvatar }} style={styles.groupAvatar} />
				<View style={styles.groupTextWrap}>
					<View style={styles.groupTitleRow}>
						<Text style={styles.groupName} numberOfLines={1}>{groupName}</Text>
						{unreadCount > 0 ? (
							<View style={styles.groupUnreadPill}>
								<Text style={styles.groupUnreadText}>{unreadCount}</Text>
							</View>
						) : null}
					</View>
					<Text style={styles.groupMeta} numberOfLines={1}>{memberCount} members</Text>
					<Text style={styles.groupPreview} numberOfLines={1}>{latestMessage}</Text>
				</View>
				<View style={styles.contactRightWrap}>
					<Ionicons name="chevron-forward" size={18} color="#8A94A6" />
				</View>
			</TouchableOpacity>
		);
	};

	const renderAdminItem = ({ item }) => {
		const adminName = `${item?.admin_first_name ?? item?.first_name ?? ''} ${item?.admin_last_name ?? item?.last_name ?? ''}`.trim() || 'Admin';
		const adminAvatar = item?.photo || item?.admin_photo
			? (item.photo || item.admin_photo)
			: `https://ui-avatars.com/api/?name=${encodeURIComponent(adminName)}&background=31429B&color=fff`;

		return (
			<TouchableOpacity
				style={styles.contactCard}
				activeOpacity={0.85}
				onPress={() => openConversation({ id: item?.id, first_name: item?.admin_first_name ?? item?.first_name, last_name: item?.admin_last_name ?? item?.last_name, alumni_photo: item?.photo ?? item?.admin_photo })}
			>
				<Image source={{ uri: adminAvatar }} style={styles.contactAvatar} />
				<View style={styles.contactTextWrap}>
					<Text style={styles.contactName} numberOfLines={1}>{adminName}</Text>
					<Text style={styles.contactMeta}>Admin</Text>
				</View>
				<View style={styles.contactRightWrap}>
					<Ionicons name="chevron-forward" size={18} color="#8A94A6" />
				</View>
			</TouchableOpacity>
		);
	};

	const getListEmptyComponent = useCallback(() => {
		if (isLoadingChatData) {
			return (
				<View style={styles.loadingWrap}>
					<ActivityIndicator color="#31429B" />
				</View>
			);
		}

		if (selectedTab === 'channels') {
			return renderEmptyState('No group chats yet.', 'Create a group conversation and it will appear here.');
		}

		if (selectedTab === 'favorites') {
			return renderEmptyState('No favorites yet.', 'Mark a chat as a favorite to keep it here.');
		}

		return renderEmptyState('No contacts yet.', 'Accepted connections will appear here as chat contacts.');
	}, [isLoadingChatData, renderEmptyState, selectedTab]);

	const listData = activeChats;
	const renderItem = ({ item }) => {
		if (item?.__chatType === 'group') {
			return renderGroupChatItem({ item });
		}

		return renderContactItem({ item });
	};

	return (
		<SafeAreaView style={styles.safeArea} edges={['top']}>
			<View style={styles.container}>
				<BrandHeader />

				<View style={styles.contentWrap}>
					<View style={styles.userRow}>
						<View style={styles.userInfoRow}>
							<Image source={{ uri: avatarUri }} style={[styles.avatar, { width: layout.avatarSize, height: layout.avatarSize, borderRadius: layout.avatarSize / 2 }]} />
							<View style={styles.userTextWrap}>
								<Text style={styles.helloText}>Hello,</Text>
								<Text style={styles.nameText} numberOfLines={1}>
									{displayName}
								</Text>
							</View>
						</View>

						<View style={styles.actionsRow}>
							<TouchableOpacity
								style={[styles.circleAction, { width: layout.actionSize, height: layout.actionSize, borderRadius: layout.actionSize / 2 }]}
								onPress={openSearchMessage}
								activeOpacity={0.8}
							>
								<Ionicons name="search-outline" size={25} color="#31429B" />
							</TouchableOpacity>
							<TouchableOpacity style={[styles.circleAction, styles.composeAction, { width: layout.actionSize, height: layout.actionSize, borderRadius: layout.actionSize / 2 }]} onPress={openNewMessage} activeOpacity={0.8}>
								<Ionicons name="create-outline" size={20} color="#FFFFFF" />
							</TouchableOpacity>
						</View>
					</View>

							{/* Admin messaging quick access */}
							{isLoadingAdmins ? (
								<View style={styles.adminLoadingWrap}>
									<ActivityIndicator color="#31429B" />
								</View>
							) : admins && admins.length > 0 ? (
								admins.length === 1 ? (
									<TouchableOpacity
										style={styles.contactCard}
										activeOpacity={0.85}
										onPress={() => openConversation({ id: admins[0]?.id, first_name: admins[0]?.admin_first_name ?? admins[0]?.first_name, last_name: admins[0]?.admin_last_name ?? admins[0]?.last_name, alumni_photo: admins[0]?.photo ?? admins[0]?.admin_photo })}
									>
										<Image source={{ uri: admins[0]?.photo ?? admins[0]?.admin_photo ?? `https://ui-avatars.com/api/?name=${encodeURIComponent((admins[0]?.admin_first_name ?? admins[0]?.first_name) || 'Admin')}&background=31429B&color=fff` }} style={styles.contactAvatar} />
										<View style={styles.contactTextWrap}>
											<Text style={styles.contactName} numberOfLines={1}>{`${admins[0]?.admin_first_name ?? admins[0]?.first_name ?? ''} ${admins[0]?.admin_last_name ?? admins[0]?.last_name ?? ''}`.trim() || 'Admin'}</Text>
											<Text style={styles.contactMeta}>Message Admin</Text>
										</View>
										<View style={styles.contactRightWrap}>
											<Ionicons name="chevron-forward" size={18} color="#8A94A6" />
										</View>
									</TouchableOpacity>
								) : (
									<FlatList
										data={admins}
										renderItem={renderAdminItem}
										keyExtractor={(item) => `admin-${String(item?.id)}`}
										showsVerticalScrollIndicator={false}
										contentContainerStyle={styles.listContent}
									/>
								)
							) : null}

							<View style={styles.segmentedWrap}>
						{TABS.map((tab) => {
							const isActive = selectedTab === tab.key;
							return (
								<TouchableOpacity
									key={tab.key}
									style={[styles.segmentItem, isActive && styles.segmentItemActive]}
									onPress={() => setSelectedTab(tab.key)}
									activeOpacity={0.85}
								>
									<Text style={[styles.segmentText, isActive && styles.segmentTextActive]}>
										{tab.label}
									</Text>
								</TouchableOpacity>
							);
						})}
					</View>

					<View style={styles.listArea}>
						<FlatList
							data={listData}
							renderItem={renderItem}
							keyExtractor={(item) => `${item?.__chatType ?? 'chat'}-${String(item?.group_chat_id ?? item?.connection_id ?? item?.id)}`}
							showsVerticalScrollIndicator={false}
							contentContainerStyle={styles.listContent}
							refreshing={isLoadingChatData}
							onRefresh={loadChatData}
							ListEmptyComponent={getListEmptyComponent}
						/>
					</View>
				</View>
			</View>
		</SafeAreaView>
	);
};

export default ChatScreen;
