import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Image, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import api from '../services/api';
import BrandHeader from '../components/BrandHeader';
import styles from '../styles/CreatePostScreen.styles';
import { getAuthToken } from '../services/authStorage';

const CreatePostScreen = () => {
	const navigation = useNavigation();
	const [postText, setPostText] = useState('');
	const [userData, setUserData] = useState(null);
	const [selectedAudience, setSelectedAudience] = useState('Public');
	const [selectedPhotoUris, setSelectedPhotoUris] = useState([]);
	const [selectedVideoUris, setSelectedVideoUris] = useState([]);
	const [isPickingPhoto, setIsPickingPhoto] = useState(false);
	const [isPickingVideo, setIsPickingVideo] = useState(false);

	const canPost = postText.trim().length > 0;

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
				console.error('Failed to fetch create post profile:', error);
			}
		};

		fetchProfile();
	}, []);

	const profileName = useMemo(() => {
		if (!userData) {
			return 'Alumni';
		}

		return [userData.first_name, userData.last_name].filter(Boolean).join(' ').trim() || 'Alumni';
	}, [userData]);

	const profileImageUri = useMemo(() => {
		if (userData?.alumni_photo) {
			return userData.alumni_photo;
		}

		return `https://ui-avatars.com/api/?name=${encodeURIComponent(profileName)}&background=31429B&color=fff`;
	}, [profileName, userData]);

	const audienceOptions = [
		{ key: 'Public', icon: 'earth-outline' },
		{ key: 'Private', icon: 'lock-closed-outline' },
		{ key: 'Friends', icon: 'people-outline' },
	];

	const handlePickMedia = async (mediaType, setIsPickingState, setSelectedUris, permissionMessage) => {
		try {
			setIsPickingState(true);

			const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
			if (permissionResult.status !== 'granted') {
				Alert.alert('Permission required', permissionMessage);
				return;
			}

			const result = await ImagePicker.launchImageLibraryAsync({
				mediaTypes: [mediaType],
				allowsEditing: false,
				allowsMultipleSelection: true,
				selectionLimit: 10,
				quality: 0.85,
			});

			const pickedUris = result.assets
				? result.assets.map((asset) => asset.uri).filter(Boolean)
				: result.uri
					? [result.uri]
					: [];

			if (pickedUris.length > 0) {
				setSelectedUris(pickedUris);
			}
		} catch (error) {
			console.error('Failed to pick media:', error);
			Alert.alert('Error', 'Unable to open the media library.');
		} finally {
			setIsPickingState(false);
		}
	};

	const handlePickPhoto = () => handlePickMedia('images', setIsPickingPhoto, setSelectedPhotoUris, 'Permission to access photos is required to choose an image.');

	const handlePickVideo = () => handlePickMedia('videos', setIsPickingVideo, setSelectedVideoUris, 'Permission to access photos is required to choose a video.');

	const handleRemovePhoto = (uriToRemove) => {
		setSelectedPhotoUris((currentUris) => currentUris.filter((uri) => uri !== uriToRemove));
	};

	const handleRemoveVideo = (uriToRemove) => {
		setSelectedVideoUris((currentUris) => currentUris.filter((uri) => uri !== uriToRemove));
	};

	return (
		<SafeAreaView style={styles.safeArea} edges={['top']}>
			<View style={styles.container}>
				<BrandHeader />

				<ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
					<View style={styles.card}>
						<Pressable style={styles.backButton} onPress={() => navigation.goBack()} hitSlop={8}>
							<Ionicons name="arrow-back" size={22} color="#31429B" />
						</Pressable>

						<View style={styles.cardHeader}>
								<View style={styles.audienceOptionsRow}>
									{audienceOptions.map((option) => {
										const isSelected = selectedAudience === option.key;

										return (
											<Pressable
												key={option.key}
												style={[styles.audiencePill, isSelected && styles.audiencePillSelected]}
												onPress={() => setSelectedAudience(option.key)}
												android_ripple={{ color: '#EAF0FF' }}
											>
												<Ionicons name={option.icon} size={14} color="#31429B" />
												<Text style={styles.audiencePillText}>{option.key}</Text>
												{isSelected ? <Ionicons name="checkmark-circle" size={14} color="#31429B" style={styles.audienceCheckIcon} /> : null}
											</Pressable>
										);
									})}
								</View>
						</View>

						<View style={styles.composeRow}>
							<Image
								source={{ uri: profileImageUri }}
								style={styles.avatar}
							/>
							<View style={styles.composeBody}>
								<Text style={styles.composeName}>{profileName}</Text>
							</View>
						</View>

						<TextInput
							value={postText}
							onChangeText={setPostText}
							placeholder="What's on your mind?"
							placeholderTextColor="#8A94A6"
							multiline
							textAlignVertical="top"
							style={[styles.input, styles.postInput]}
						/>

						<View style={styles.toolbarRow}>
							<Pressable style={styles.toolbarButton} onPress={handlePickPhoto} android_ripple={{ color: '#EAF0FF' }} disabled={isPickingPhoto}>
								<Ionicons name="image-outline" size={18} color="#31429B" />
								<Text style={styles.toolbarButtonText}>Photo</Text>
							</Pressable>

							<Pressable style={styles.toolbarButton} onPress={handlePickVideo} android_ripple={{ color: '#EAF0FF' }} disabled={isPickingVideo}>
								<Ionicons name="videocam-outline" size={18} color="#31429B" />
								<Text style={styles.toolbarButtonText}>Video</Text>
							</Pressable>

							<Pressable style={styles.toolbarButton} android_ripple={{ color: '#EAF0FF' }}>
								<Ionicons name="location-outline" size={18} color="#31429B" />
								<Text style={styles.toolbarButtonText}>Location</Text>
							</Pressable>
						</View>

						<View style={styles.previewCard}>
							<View style={styles.previewImageWrap}>
								{selectedPhotoUris.length === 1 ? (
									<View style={styles.previewMediaItem}>
										<Image source={{ uri: selectedPhotoUris[0] }} style={styles.previewImage} resizeMode="cover" />
										<Pressable style={styles.previewRemoveButton} onPress={() => handleRemovePhoto(selectedPhotoUris[0])}>
											<Ionicons name="close" size={14} color="#FFFFFF" />
										</Pressable>
									</View>
								) : selectedPhotoUris.length > 1 ? (
									<View style={styles.previewGrid}>
										{selectedPhotoUris.map((uri) => (
											<View key={uri} style={styles.previewGridItem}>
												<Image source={{ uri }} style={styles.previewThumbnail} resizeMode="cover" />
												<Pressable style={styles.previewRemoveButton} onPress={() => handleRemovePhoto(uri)}>
													<Ionicons name="close" size={14} color="#FFFFFF" />
												</Pressable>
											</View>
										))}
									</View>
								) : selectedVideoUris.length === 1 ? (
									<View style={styles.previewMediaItem}>
										<View style={styles.previewVideoTile}>
											<Ionicons name="play-circle-outline" size={44} color="#31429B" />
											<Text style={styles.previewVideoText}>Video selected</Text>
										</View>
										<Pressable style={styles.previewRemoveButton} onPress={() => handleRemoveVideo(selectedVideoUris[0])}>
											<Ionicons name="close" size={14} color="#FFFFFF" />
										</Pressable>
									</View>
								) : selectedVideoUris.length > 1 ? (
									<View style={styles.previewGrid}>
										{selectedVideoUris.map((uri) => (
											<View key={uri} style={styles.previewGridItem}>
												<View style={styles.previewVideoTile}>
													<Ionicons name="play-circle-outline" size={44} color="#31429B" />
													<Text style={styles.previewVideoText}>Video selected</Text>
												</View>
												<Pressable style={styles.previewRemoveButton} onPress={() => handleRemoveVideo(uri)}>
													<Ionicons name="close" size={14} color="#FFFFFF" />
												</Pressable>
											</View>
										))}
									</View>
								) : (
									<>
										<Ionicons name="image-outline" size={30} color="#9CA3AF" />
										<Text style={styles.previewText}>Media preview will appear here.</Text>
									</>
								)}
							</View>
						</View>

						<View style={styles.footerRow}>
							<Pressable style={styles.saveDraftButton} android_ripple={{ color: '#EAF0FF' }}>
								<Text style={styles.saveDraftText}>Save Draft</Text>
							</Pressable>

							<Pressable style={[styles.postButton, !canPost && styles.postButtonDisabled]} android_ripple={{ color: '#24346F' }} disabled={!canPost}>
								<Text style={styles.postButtonText}>Post</Text>
							</Pressable>
						</View>
					</View>
				</ScrollView>
			</View>
		</SafeAreaView>
	);
};

export default CreatePostScreen;
