import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Image, Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import api from '../services/api';
import BrandHeader from '../components/BrandHeader';
import styles from '../styles/CreatePostScreen.styles';
import { getAuthToken } from '../services/authStorage';
import { showBrandedAlert } from '../services/brandedAlert';

const CreatePostScreen = () => {
	const navigation = useNavigation();
	const route = useRoute();
	const editingPost = route.params?.post ?? null;
	const isEditMode = Boolean(editingPost?.id);
	const [postText, setPostText] = useState('');
	const [userData, setUserData] = useState(null);
	const [selectedAudience, setSelectedAudience] = useState('public');
	const [selectedPhotoUris, setSelectedPhotoUris] = useState([]);
	const [selectedPhotoFiles, setSelectedPhotoFiles] = useState([]);
	const [selectedVideoUris, setSelectedVideoUris] = useState([]);
	const [existingPhotoItems, setExistingPhotoItems] = useState([]);
	const [removedExistingPhotoIds, setRemovedExistingPhotoIds] = useState([]);
	const [isPickingPhoto, setIsPickingPhoto] = useState(false);
	const [isPickingVideo, setIsPickingVideo] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [submitAction, setSubmitAction] = useState(null);

	const canPost = postText.trim().length > 0 || selectedPhotoUris.length > 0;

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
		{ value: 'public', label: 'Public', icon: 'earth-outline' },
		{ value: 'private', label: 'Private', icon: 'lock-closed-outline' },
		{ value: 'friends', label: 'Friends', icon: 'people-outline' },
	];

	useEffect(() => {
		if (!editingPost) {
			setExistingPhotoItems([]);
			setRemovedExistingPhotoIds([]);
			setSelectedPhotoFiles([]);
			return;
		}

		setPostText(editingPost.caption ?? '');
		setSelectedAudience(editingPost.visibility ?? 'public');
		setSelectedPhotoUris([]);
		setSelectedPhotoFiles([]);
		setSelectedVideoUris([]);
		setRemovedExistingPhotoIds([]);
		setExistingPhotoItems(
			Array.isArray(editingPost.images)
				? editingPost.images
					.map((image) => ({
						id: image?.id ?? null,
						uri: image?.image_url ?? image?.image_path ?? image?.uri ?? '',
					}))
					.filter((image) => Boolean(image.uri))
				: []
		);
	}, [editingPost]);

	const handlePickMedia = async (mediaType, setIsPickingState, onPickedMedia, permissionMessage) => {
		try {
			setIsPickingState(true);

			const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
			if (permissionResult.status !== 'granted') {
				showBrandedAlert('Permission required', permissionMessage, [{ text: 'OK' }], { variant: 'error' });
				return;
			}

			const result = await ImagePicker.launchImageLibraryAsync({
				mediaTypes: [mediaType],
				allowsEditing: false,
				allowsMultipleSelection: true,
				selectionLimit: 10,
				quality: 0.85,
			});

			const pickedAssets = Array.isArray(result.assets)
				? result.assets.filter((asset) => Boolean(asset?.uri))
				: result.uri
					? [{ uri: result.uri, fileName: null, mimeType: null }]
					: [];

			if (pickedAssets.length > 0) {
				onPickedMedia(pickedAssets);
			}
		} catch (error) {
			console.error('Failed to pick media:', error);
			showBrandedAlert('Upload failed', 'Unable to open the media library.', [{ text: 'OK' }], { variant: 'error' });
		} finally {
			setIsPickingState(false);
		}
	};

	const handlePickPhoto = () => handlePickMedia(
		'images',
		setIsPickingPhoto,
		(pickedAssets) => {
			setSelectedPhotoUris(pickedAssets.map((asset) => asset.uri));
			setSelectedPhotoFiles(pickedAssets);
		},
		'Permission to access photos is required to choose an image.'
	);

	const handlePickVideo = () => handlePickMedia('videos', setIsPickingVideo, setSelectedVideoUris, 'Permission to access photos is required to choose a video.');

	const handleRemovePhoto = (uriToRemove) => {
		setSelectedPhotoUris((currentUris) => currentUris.filter((uri) => uri !== uriToRemove));
		setSelectedPhotoFiles((currentFiles) => currentFiles.filter((file) => file.uri !== uriToRemove));
	};

	const handleRemoveExistingPhoto = (imageId) => {
		setRemovedExistingPhotoIds((currentIds) => (currentIds.includes(imageId) ? currentIds : [...currentIds, imageId]));
	};

	const handleRemoveVideo = (uriToRemove) => {
		setSelectedVideoUris((currentUris) => currentUris.filter((uri) => uri !== uriToRemove));
	};

	const previewPhotoItems = [
		...existingPhotoItems
			.filter((image) => !removedExistingPhotoIds.includes(image.id))
			.map((image) => ({
				key: image.id ?? image.uri,
				uri: image.uri,
				type: 'existing',
				imageId: image.id,
			})),
		...selectedPhotoUris.map((uri) => ({
			key: uri,
			uri,
			type: 'selected',
		})),
	];

	const getImageMimeType = (uri) => {
		const extension = uri.split('.').pop()?.toLowerCase();

		switch (extension) {
			case 'jpg':
			case 'jpeg':
				return 'image/jpeg';
			case 'png':
				return 'image/png';
			case 'heic':
				return 'image/heic';
			case 'webp':
				return 'image/webp';
			default:
				return 'image/jpeg';
		}
	};

	const buildImageFile = (uri, index, asset = null) => ({
		uri,
		name: asset?.fileName ?? `post-image-${index + 1}.${uri.split('.').pop()?.toLowerCase() || 'jpg'}`,
		type: asset?.mimeType ?? getImageMimeType(uri),
	});

	const handleSubmitPost = async (isDraft = false) => {
		if (isSubmitting) {
			return;
		}

		if (selectedVideoUris.length > 0) {
			showBrandedAlert(
				'Unsupported media',
				'Video uploads are not supported yet. Remove the selected video(s) and try again.',
				[{ text: 'OK' }],
				{ variant: 'error' }
			);
			return;
		}

		if (!isDraft && !canPost) {
			return;
		}

		try {
			setIsSubmitting(true);
			setSubmitAction(
				isDraft
					? 'draft'
					: isEditMode && editingPost?.is_draft
						? 'publish-draft'
						: 'publish'
			);

			const token = await getAuthToken();
			if (!token) {
				showBrandedAlert('Sign in required', 'Please sign in again before creating a post.', [{ text: 'OK' }], { variant: 'error' });
				return;
			}

			const formData = new FormData();
			const trimmedCaption = postText.trim();

			if (trimmedCaption.length > 0) {
				formData.append('caption', trimmedCaption);
			}

			formData.append('visibility', selectedAudience);
			formData.append('is_draft', isDraft ? '1' : '0');

			if (isEditMode && removedExistingPhotoIds.length > 0) {
				removedExistingPhotoIds.forEach((imageId) => {
					formData.append('remove_image_ids[]', String(imageId));
				});
			}

			selectedPhotoUris.forEach((uri, index) => {
				formData.append('images[]', buildImageFile(uri, index, selectedPhotoFiles[index] ?? null));
			});

			if (isEditMode) {
				await api.post(`/posts/${editingPost.id}?_method=PATCH`, formData, {
					headers: {
						Authorization: `Bearer ${token}`,
						'Content-Type': 'multipart/form-data',
					},
				});
			} else {
				await api.post('/posts', formData, {
				headers: {
					Authorization: `Bearer ${token}`,
					'Content-Type': 'multipart/form-data',
				},
			});
			}

			setPostText('');
			setSelectedAudience('public');
			setSelectedPhotoUris([]);
			setSelectedVideoUris([]);
			showBrandedAlert(isDraft ? 'Draft saved' : isEditMode ? 'Post updated' : 'Post created', isDraft ? 'Your draft was saved successfully.' : isEditMode ? 'Your post was updated successfully.' : 'Your post was added successfully.', [
				{ text: 'OK', onPress: () => navigation.goBack() },
			], { variant: 'success' });
		} catch (error) {
			console.error('Failed to create post:', error);
			showBrandedAlert('Upload failed', isEditMode ? 'Unable to update your post right now. Please try again.' : 'Unable to create your post right now. Please try again.', [{ text: 'OK' }], { variant: 'error' });
		} finally {
			setIsSubmitting(false);
			setSubmitAction(null);
		}
	};

	const getSubmitModalTitle = () => {
		if (submitAction === 'draft') {
			return 'Saving your draft';
		}

		if (submitAction === 'publish-draft') {
			return 'Publishing your draft';
		}

		if (submitAction === 'publish') {
			return isEditMode ? 'Updating your post' : 'Posting your content';
		}

		return isEditMode ? 'Updating your post' : 'Posting your content';
	};

	const getSubmitModalText = () => {
		if (submitAction === 'draft') {
			return 'Please wait while your draft is saved.';
		}

		if (submitAction === 'publish-draft') {
			return 'Please wait while your draft is published.';
		}

		if (submitAction === 'publish') {
			return isEditMode ? 'Please wait while your changes are saved.' : 'Please wait while your post uploads.';
		}

		return isEditMode ? 'Please wait while your changes are saved.' : 'Please wait while your post uploads.';
	};

	const isPublishDisabled = !isEditMode && !canPost;

	return (
		<>
			<SafeAreaView style={styles.safeArea} edges={['top']}>
				<View style={styles.container}>
					<BrandHeader />

					<ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
						<View style={styles.card}>
							<Pressable style={styles.backButton} onPress={() => navigation.goBack()} hitSlop={8}>
								<Ionicons name="arrow-back" size={22} color="#31429B" />
							</Pressable>

							{isEditMode ? <Text style={styles.editNotice}>Editing this post. Keep the current images or add new ones below.</Text> : null}

							<View style={styles.cardHeader}>
								<View style={styles.audienceOptionsRow}>
									{audienceOptions.map((option) => {
										const isSelected = selectedAudience === option.value;

										return (
											<Pressable
												key={option.value}
												style={[styles.audiencePill, isSelected && styles.audiencePillSelected]}
												onPress={() => setSelectedAudience(option.value)}
												android_ripple={{ color: '#EAF0FF' }}
											>
												<Ionicons name={option.icon} size={14} color="#31429B" />
												<Text style={styles.audiencePillText}>{option.label}</Text>
												{isSelected ? <Ionicons name="checkmark-circle" size={14} color="#31429B" style={styles.audienceCheckIcon} /> : null}
											</Pressable>
										);
									})}
								</View>
							</View>

							<View style={styles.composeRow}>
								<Image source={{ uri: profileImageUri }} style={styles.avatar} />
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
									{previewPhotoItems.length > 0 ? (
										previewPhotoItems.length === 1 ? (
											<View style={styles.previewMediaItem}>
													<Image source={{ uri: previewPhotoItems[0].uri }} style={styles.previewImage} resizeMode="contain" />
													<Pressable
														style={styles.previewRemoveButton}
														onPress={() => (previewPhotoItems[0].type === 'existing' ? handleRemoveExistingPhoto(previewPhotoItems[0].imageId) : handleRemovePhoto(previewPhotoItems[0].uri))}
													>
														<Ionicons name="close" size={14} color="#FFFFFF" />
													</Pressable>
											</View>
										) : (
											<View style={styles.previewGrid}>
												{previewPhotoItems.map((item) => (
													<View key={item.key} style={styles.previewGridItem}>
														<Image source={{ uri: item.uri }} style={styles.previewThumbnail} resizeMode="contain" />
														<Pressable
															style={styles.previewRemoveButton}
															onPress={() => (item.type === 'existing' ? handleRemoveExistingPhoto(item.imageId) : handleRemovePhoto(item.uri))}
														>
																<Ionicons name="close" size={14} color="#FFFFFF" />
															</Pressable>
													</View>
												))}
											</View>
										)
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
										)
									}
								</View>
							</View>

							<View style={styles.footerRow}>
								<Pressable style={styles.saveDraftButton} android_ripple={{ color: '#EAF0FF' }} onPress={() => handleSubmitPost(true)} disabled={isSubmitting}>
									<Text style={styles.saveDraftText}>Save Draft</Text>
								</Pressable>

								<Pressable style={[styles.postButton, isPublishDisabled && styles.postButtonDisabled]} onPress={() => handleSubmitPost(false)} android_ripple={{ color: '#24346F' }} disabled={isPublishDisabled || isSubmitting}>
									<Text style={styles.postButtonText}>{isEditMode ? 'Update' : 'Post'}</Text>
								</Pressable>
							</View>
						</View>
					</ScrollView>
				</View>
			</SafeAreaView>

			<Modal visible={isSubmitting} transparent animationType="fade" statusBarTranslucent>
				<View style={styles.uploadModalBackdrop}>
					<View style={styles.uploadModalCard}>
						<ActivityIndicator size="large" color="#31429B" />
						<Text style={styles.uploadModalTitle}>{getSubmitModalTitle()}</Text>
						<Text style={styles.uploadModalText}>{getSubmitModalText()}</Text>
					</View>
				</View>
			</Modal>
		</>
	);
};

export default CreatePostScreen;
