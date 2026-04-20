import React, { useEffect, useMemo, useState } from 'react';
import { Image, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';
import BrandHeader from '../components/BrandHeader';
import styles from '../styles/UserFeedScreen.styles';
import { getAuthToken } from '../services/authStorage';

const UserFeedScreen = () => {
	// SECTION: Screen state
	const [userData, setUserData] = useState(null);

	// SECTION: Load profile data
	useEffect(() => {
		const fetchProfile = async () => {
			try {
				const token = await getAuthToken();

				if (!token) {
					return;
				}

				const response = await api.get('/alumni/profile', {
					headers: { Authorization: `Bearer ${token}` },
				});

				setUserData(response.data?.alumni ?? null);
			} catch (error) {
				console.error('Failed to fetch feed profile:', error);
			}
		};

		fetchProfile();
	}, []);

	// DERIVED VALUE: Avatar URI
	const alumniPhotoUri = useMemo(() => {
		if (userData?.alumni_photo) {
			return userData.alumni_photo;
		}

		const displayName = [userData?.first_name, userData?.last_name]
			.filter(Boolean)
			.join(' ')
			.trim() || 'Alumni';

		return `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=31429B&color=fff`;
	}, [userData]);

	return (
		<SafeAreaView style={styles.safeArea} edges={['top']}>
			<View style={styles.container}>
				<BrandHeader />

				{/* SECTION: Feed composer */}
				<ScrollView
					showsVerticalScrollIndicator={false}
					contentContainerStyle={styles.content}
				>
					<View style={styles.searchRow}>
						<Image
							source={{ uri: alumniPhotoUri }}
							style={styles.searchAvatar}
						/>

						<View style={styles.searchWrap}>
							<TextInput
								placeholder="Search"
								placeholderTextColor="#8F8F8F"
								style={styles.searchInput}
							/>
							<Ionicons name="search-outline" size={22} color="#7A7A7A" />
						</View>
					</View>

					<View style={styles.createPostCard}>
						<Text style={styles.createPostTitle}>Create a Post</Text>

						<View style={styles.composeRow}>
							<View style={styles.composeBubble}>
								<Image
									source={{ uri: alumniPhotoUri }}
									style={styles.composeAvatar}
								/>
								<Text style={styles.composePrompt}>What do you want to talk about?</Text>
							</View>

							<Pressable style={styles.sendButton}>
								<Ionicons name="send" size={20} color="#31429B" />
							</Pressable>
						</View>

						<View style={styles.actionRow}>
							<View style={styles.actionChip}>
								<Ionicons name="image-outline" size={13} color="#31429B" />
								<Text style={styles.actionChipText}>Add Photos/Videos</Text>
							</View>

							<View style={styles.actionChip}>
								<Ionicons name="earth-outline" size={13} color="#31429B" />
								<Text style={styles.actionChipText}>Shared to Public</Text>
							</View>
						</View>
					</View>

					<View style={styles.emptySpace} />
				</ScrollView>
			</View>
		</SafeAreaView>
	);
};

export default UserFeedScreen;
