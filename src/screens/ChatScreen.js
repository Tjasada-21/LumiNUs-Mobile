import React, { useEffect, useMemo, useState } from 'react';
import {
	View,
	Text,
	StyleSheet,
	Image,
	TouchableOpacity,
	ScrollView,
	useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import api from '../services/api';

const TABS = [
	{ key: 'all', label: 'All Chats' },
	{ key: 'channels', label: 'Channels' },
	{ key: 'favorites', label: 'Favorites' },
];

const ChatScreen = () => {
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

	useEffect(() => {
		const fetchUserData = async () => {
			try {
				const token = await SecureStore.getItemAsync('userToken');

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

	const displayName = useMemo(() => {
		if (!userData) {
			return 'Alumni User';
		}
		return `${userData.first_name ?? ''}`.trim() || 'Alumni User';
	}, [userData]);

	const avatarUri = useMemo(() => {
		if (userData?.alumni_photo) {
			return userData.alumni_photo;
		}
		return `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=31429B&color=fff`;
	}, [displayName, userData]);

	return (
		<SafeAreaView style={styles.safeArea} edges={['top']}>
			<View style={styles.container}>
				<View style={styles.header}>
					<Image
						source={require('../../assets/images/lumi-n-us-logo-landscape-2.png')}
						style={[styles.headerLogo, { width: layout.headerLogoWidth, height: layout.headerLogoHeight }]}
						resizeMode="contain"
					/>

					<View style={styles.badgeContainer}>
						<Image source={require('../../assets/images/nulogo.png')} style={styles.badgeIcon} />
						<Text style={styles.badgeText}>NU LIPA</Text>
					</View>
				</View>

				<View style={styles.headerAccent} />

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
							<TouchableOpacity style={[styles.circleAction, { width: layout.actionSize, height: layout.actionSize, borderRadius: layout.actionSize / 2 }]} activeOpacity={0.8}>
								<Ionicons name="search-outline" size={25} color="#31429B" />
							</TouchableOpacity>
							<TouchableOpacity style={[styles.circleAction, styles.composeAction, { width: layout.actionSize, height: layout.actionSize, borderRadius: layout.actionSize / 2 }]} activeOpacity={0.8}>
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

					<ScrollView style={styles.listArea} contentContainerStyle={styles.listContent}>
						{/* Intentionally empty: chat data will come from backend integration. */}
					</ScrollView>
				</View>
			</View>
		</SafeAreaView>
	);
};

const styles = StyleSheet.create({
	safeArea: {
		flex: 1,
		backgroundColor: '#31429B',
	},
	container: {
		flex: 1,
		backgroundColor: '#ECECEC',
	},
	header: {
		backgroundColor: '#31429B',
		paddingHorizontal: 18,
		paddingVertical: 14,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
	},
	headerLogo: {
		width: 146,
		height: 36,
	},
	badgeContainer: {
		backgroundColor: '#FFFFFF',
		borderRadius: 20,
		paddingVertical: 7,
		paddingHorizontal: 12,
		flexDirection: 'row',
		alignItems: 'center',
	},
	badgeIcon: {
		width: 17,
		height: 17,
		marginRight: 6,
	},
	badgeText: {
		color: '#2D3F9E',
		fontWeight: '800',
		fontSize: 14,
	},
	headerAccent: {
		height: 12,
		backgroundColor: '#F2C919',
	},
	contentWrap: {
		flex: 1,
		paddingHorizontal: 16,
		paddingTop: 12,
	},
	userRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginBottom: 12,
	},
	userInfoRow: {
		flexDirection: 'row',
		alignItems: 'center',
		flex: 1,
		marginRight: 10,
	},
	userTextWrap: {
		flexShrink: 1,
	},
	avatar: {
		width: 38,
		height: 38,
		borderRadius: 19,
		marginRight: 10,
	},
	helloText: {
		color: '#6A6A6A',
		fontSize: 14,
		lineHeight: 16,
	},
	nameText: {
		color: '#3E3E3E',
		fontSize: 20,
		fontWeight: '800',
	},
	actionsRow: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	circleAction: {
		width: 40,
		height: 40,
		borderRadius: 20,
		borderWidth: 2,
		borderColor: '#31429B',
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: '#F2F3F8',
		marginLeft: 8,
	},
	composeAction: {
		backgroundColor: '#31429B',
	},
	segmentedWrap: {
		flexDirection: 'row',
		backgroundColor: '#DADBE0',
		borderRadius: 16,
		padding: 2,
		marginBottom: 6,
	},
	segmentItem: {
		flex: 1,
		borderRadius: 14,
		alignItems: 'center',
		justifyContent: 'center',
		paddingVertical: 6,
	},
	segmentItemActive: {
		backgroundColor: '#31429B',
	},
	segmentText: {
		color: '#8C8D94',
		fontSize: 14,
		fontWeight: '500',
	},
	segmentTextActive: {
		color: '#FFFFFF',
		fontWeight: '700',
	},
	listArea: {
		flex: 1,
	},
	listContent: {
		minHeight: '100%',
		paddingTop: 12,
		paddingBottom: 20,
	},
});

export default ChatScreen;
