import React, { useEffect, useMemo, useState } from 'react';
import {
	View,
	Text,
	Image,
	TouchableOpacity,
	ScrollView,
	useWindowDimensions,
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
export default ChatScreen;
