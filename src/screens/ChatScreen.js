import React, { useEffect, useMemo, useState } from 'react';
import {
	View,
	Text,
	Image,
	TouchableOpacity,
	ScrollView,
	useWindowDimensions,
	FlatList,
	ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';
import BrandHeader from '../components/BrandHeader';
import styles from '../styles/ChatScreen.styles';
import { getAuthToken } from '../services/authStorage';

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
	const [contactsLoading, setContactsLoading] = useState(false);

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

	// SECTION: Load the current user
	useEffect(() => {
		const fetchUserData = async () => {
			try {
				const token = await getAuthToken();

				if (!token) {
					return;
				}

				const response = await api.get('/user', {
					headers: { Authorization: `Bearer ${token}` },
				});
				setUserData(response.data);
			} catch (error) {
				console.error('Failed to fetch chat user profile:', error);
			}
		};

		fetchUserData();
	}, []);

	useEffect(() => {
		const fetchContacts = async () => {
			try {
				setContactsLoading(true);
				const token = await getAuthToken();

				if (!token) {
					setContacts([]);
					return;
				}

				const response = await api.get('/contacts', {
					headers: { Authorization: `Bearer ${token}` },
				});

				setContacts(response.data?.contacts ?? []);
			} catch (error) {
				console.error('Failed to fetch chat contacts:', error);
				setContacts([]);
			} finally {
				setContactsLoading(false);
			}
		};

		fetchContacts();
	}, []);

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

	const renderContactItem = ({ item }) => {
		const contactName = `${item?.first_name ?? ''} ${item?.last_name ?? ''}`.trim() || 'Alumni';
		const contactAvatar = item?.alumni_photo
			? item.alumni_photo
			: `https://ui-avatars.com/api/?name=${encodeURIComponent(contactName)}&background=31429B&color=fff`;

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
				<Ionicons name="chevron-forward" size={18} color="#8A94A6" />
			</TouchableOpacity>
		);
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
						{contactsLoading ? (
							<View style={styles.loadingWrap}>
								<ActivityIndicator color="#31429B" />
							</View>
						) : contacts.length > 0 ? (
							<FlatList
								data={contacts}
								renderItem={renderContactItem}
								keyExtractor={(item) => String(item.connection_id ?? item.id)}
								showsVerticalScrollIndicator={false}
								contentContainerStyle={styles.listContent}
							/>
						) : (
							<View style={styles.emptyWrap}>
								<Text style={styles.emptyTitle}>No contacts yet.</Text>
								<Text style={styles.emptyText}>Accepted connections will appear here as chat contacts.</Text>
							</View>
						)}
					</View>
				</View>
			</View>
		</SafeAreaView>
	);
};

export default ChatScreen;
