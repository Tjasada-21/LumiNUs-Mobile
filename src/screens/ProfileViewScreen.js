import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';
import BrandHeader from '../components/BrandHeader';
import styles from '../styles/ProfileViewScreen.styles';
import { getAuthToken } from '../services/authStorage';

const ProfileViewScreen = ({ navigation, route }) => {
	const userId = route?.params?.userId;
	const { width } = useWindowDimensions();
	const isCompactWidth = width < 375;
	const isTablet = width >= 768;
	const layout = {
		avatarSize: isTablet ? 118 : isCompactWidth ? 88 : 102,
		heroPadding: isCompactWidth ? 14 : 16,
		nameSize: isCompactWidth ? 19 : 22,
	};
	const [userData, setUserData] = useState(null);
	const [profilePosts, setProfilePosts] = useState([]);
	const [profileLoading, setProfileLoading] = useState(true);
	const [postsLoading, setPostsLoading] = useState(true);
	const [errorMessage, setErrorMessage] = useState('');

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

		return `https://ui-avatars.com/api/?name=${encodeURIComponent(profileName)}&background=1F2F6E&color=fff&size=256`;
	}, [profileName, userData]);

	const profileSummary = useMemo(() => ({
		headlineText: userData?.headline || 'Alumni member',
		locationText: userData?.location || 'NU Lipa',
		classTag: userData?.year_graduated
			? `Class of ${String(userData.year_graduated).match(/\d{4}/)?.[0] ?? String(userData.year_graduated).slice(0, 4)}`
			: 'Class of',
		sectionTag: userData?.program || 'BSIT',
		connectionsCount: userData?.connections_count ?? 0,
		postsCount: userData?.posts_count ?? 0,
		biographyText: userData?.bio || 'No biography available yet.',
	}), [userData]);

	const openNewMessage = () => {
		navigation.navigate('NewMessage', {
			userId,
			userName: profileName,
			userAvatarUri: profileImageUri,
		});
	};

	const workExperience = useMemo(() => {
		if (Array.isArray(userData?.work_experiences) && userData.work_experiences.length > 0) {
			return userData.work_experiences[0];
		}

		return {
			title: 'Student Developer',
			subtitle: 'NU Lipa - LumiNUs Portal',
			period: '2021 - 2022',
			location: 'Lipa City, Batangas',
			description: 'Contributed to the development of the university\'s alumni portal.',
		};
	}, [userData]);

	const repostsCount = useMemo(
		() => profilePosts.filter((post) => post?.feed_type === 'repost').length,
		[profilePosts]
	);

	const getPostAuthorName = (post) => {
		const firstName = post?.alumni?.first_name ?? '';
		const lastName = post?.alumni?.last_name ?? '';

		return [firstName, lastName].filter(Boolean).join(' ').trim() || 'Alumni';
	};

	const getPostImageUri = (image) => image?.image_url ?? image?.image_path ?? '';

	const renderProfilePostImages = (postImages = []) => {
		if (!Array.isArray(postImages) || postImages.length === 0) {
			return null;
		}

		const visibleImages = postImages.slice(0, 4);
		const remainingCount = Math.max(postImages.length - 4, 0);

		return (
			<View style={styles.profilePostImagesGrid}>
				{visibleImages.map((image, imageIndex) => (
					<View key={image?.id ?? `${imageIndex}-${getPostImageUri(image)}`} style={[styles.profilePostImageTile, imageIndex === 0 && visibleImages.length === 1 ? styles.profilePostImageTileSingle : null, imageIndex > 0 ? styles.profilePostImageTileWithGap : null]}>
						<Image
							source={{ uri: getPostImageUri(image) }}
							style={styles.profilePostImage}
							resizeMode="cover"
						/>
						{imageIndex === 3 && remainingCount > 0 ? (
							<View
								style={{
									position: 'absolute',
									top: 0,
									right: 0,
									bottom: 0,
									left: 0,
									backgroundColor: 'rgba(15, 23, 42, 0.45)',
									alignItems: 'center',
									justifyContent: 'center',
								}}
							>
								<Text style={{ color: '#FFFFFF', fontSize: 22, fontWeight: '800' }}>+{remainingCount}</Text>
							</View>
						) : null}
					</View>
				))}
			</View>
		);
	};

	useEffect(() => {
		if (!userId) {
			setErrorMessage('Missing profile information.');
			setProfileLoading(false);
			setPostsLoading(false);
			return;
		}

		let isMounted = true;

		const fetchProfile = async () => {
			try {
				setProfileLoading(true);
				setPostsLoading(true);
				setErrorMessage('');

				const token = await getAuthToken();

				if (!token) {
					setErrorMessage('No active session found.');
					return;
				}

				const profileRequest = api.get(`/alumni/${userId}`, {
					headers: { Authorization: `Bearer ${token}` },
				});

				const postsRequest = api.get(`/alumni/${userId}/posts`, {
					headers: { Authorization: `Bearer ${token}` },
				});

				const profileResponse = await profileRequest;

				if (!isMounted) {
					return;
				}

				setUserData(profileResponse.data?.alumni ?? null);
				setProfileLoading(false);

				const postsResponse = await postsRequest;

				if (!isMounted) {
					return;
				}

				setProfilePosts(postsResponse.data?.posts ?? []);
			} catch (fetchError) {
				console.error('Failed to fetch profile view:', fetchError);

				if (isMounted) {
					setErrorMessage('Unable to load this profile right now.');
				}
			} finally {
				if (isMounted) {
					setProfileLoading(false);
					setPostsLoading(false);
				}
			}
		};

		fetchProfile();

		return () => {
			isMounted = false;
		};
	}, [userId]);

	return (
		<SafeAreaView style={styles.safeArea} edges={['top']}>
			<View style={styles.container}>
				<BrandHeader />

				<ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
						{profileLoading && !userData ? (
						<View style={styles.stateWrap}>
							<ActivityIndicator size="large" color="#31429B" />
						</View>
					) : errorMessage ? (
						<View style={styles.stateWrap}>
							<Text style={styles.errorText}>{errorMessage}</Text>
							<Pressable style={styles.actionButton} onPress={() => navigation.goBack()}>
								<Text style={styles.actionButtonText}>Go Back</Text>
							</Pressable>
						</View>
					) : (
						<>
								<View style={[styles.heroCard, { padding: layout.heroPadding }]}>
									<View style={styles.heroBackRow}>
										<Pressable style={styles.iconButton} onPress={() => navigation.goBack()}>
											<Ionicons name="arrow-back" size={18} color="#31429B" />
										</Pressable>
									</View>

									<View style={styles.heroRow}>
										<Image
											source={{ uri: profileImageUri }}
											style={[
												styles.avatar,
												{
													width: layout.avatarSize,
													height: layout.avatarSize,
													borderRadius: layout.avatarSize / 2,
												},
											]}
										/>

										<View style={styles.heroCopy}>
											<View style={styles.heroTitleRow}>
												<Text style={[styles.name, { fontSize: layout.nameSize, lineHeight: layout.nameSize + 2 }]}>
													{profileName}
												</Text>
											</View>

											<View style={styles.tagPill}>
												<Ionicons name="school" size={11} color="#31429B" />
												<Text style={styles.tagText}>
													{profileSummary.classTag} | {profileSummary.sectionTag}
												</Text>
											</View>

											<View style={styles.statsRow}>
												<View style={styles.statBlock}>
													<Text style={styles.statValue}>{profileSummary.connectionsCount}</Text>
													<Text style={styles.statLabel}>Connections</Text>
												</View>
												<View style={styles.statBlock}>
													<Text style={styles.statValue}>{profileSummary.postsCount}</Text>
													<Text style={styles.statLabel}>Posts</Text>
												</View>
												<View style={styles.statBlock}>
													<Text style={styles.statValue}>{repostsCount}</Text>
													<Text style={styles.statLabel}>Reposts</Text>
												</View>
											</View>
										</View>
									</View>

									<View style={styles.heroActionsRow}>
										<TouchableOpacity style={styles.addConnectionButton} activeOpacity={0.85}>
											<Ionicons name="person-add-outline" size={14} color="#FFFFFF" />
											<Text style={styles.addConnectionButtonText}>Add Connection</Text>
										</TouchableOpacity>

										<TouchableOpacity style={styles.messageButton} activeOpacity={0.85} onPress={openNewMessage}>
											<Ionicons name="chatbubble-ellipses-outline" size={12} color="#31429B" />
											<Text style={styles.messageButtonText}>Message</Text>
										</TouchableOpacity>
									</View>
								</View>

								<View style={styles.aboutSectionWrap}>
										<View style={styles.aboutSectionCard}>
											<View style={styles.sectionHeaderRow}>
												<Text style={styles.sectionHeading}>About Me</Text>
											</View>
											<View style={styles.aboutItem}>
												<Ionicons name="briefcase" size={16} color="#404040" />
												<Text style={styles.aboutText}>{profileSummary.headlineText}</Text>
											</View>
											<View style={styles.aboutItem}>
												<Ionicons name="location-sharp" size={16} color="#404040" />
												<Text style={styles.aboutText}>{profileSummary.locationText}</Text>
											</View>
										</View>
									</View>

								<View style={styles.sectionBlock}>
									<View style={styles.bioSectionCard}>
										<View style={styles.sectionHeaderRow}>
											<Text style={styles.sectionHeading}>Biography</Text>
										</View>
										<Text style={styles.biographyText}>{profileSummary.biographyText}</Text>
									</View>
								</View>

								<View style={styles.sectionBlock}>
									<View style={styles.workSectionCard}>
										<Text style={styles.sectionHeading}>Work Experience</Text>
										<View style={styles.workCard}>
											<View style={styles.workRow}>
												<View style={styles.workNavButton}>
													<Ionicons name="chevron-back" size={18} color="#31429B" />
												</View>

												<View style={styles.workContent}>
													<View style={styles.workTitleRow}>
														<Ionicons name="briefcase" size={15} color="#31429B" />
														<Text style={styles.workTitle}>{workExperience.title}</Text>
													</View>
													<Text style={styles.workSubtitle}>{workExperience.subtitle}</Text>
													<Text style={styles.workPeriod}>{workExperience.period}</Text>
													<View style={styles.workLocationRow}>
														<Ionicons name="location-sharp" size={15} color="#5C6471" />
														<Text style={styles.workLocation}>{workExperience.location}</Text>
													</View>
													<Text style={styles.workDescription}>{workExperience.description}</Text>

													<View style={styles.paginationRow}>
														<View style={styles.paginationDot} />
														<View style={styles.paginationDot} />
														<View style={[styles.paginationDot, styles.paginationDotActive]} />
													</View>
												</View>

												<View style={styles.workNavButton}>
													<Ionicons name="chevron-forward" size={18} color="#31429B" />
												</View>
											</View>
										</View>
									</View>
								</View>

								<View style={styles.postsSectionBlock}>
									<View style={styles.postsHeaderRow}>
										<Text style={styles.sectionHeading}>Posts</Text>
										<View style={styles.createPostButton}>
											<Ionicons name="document-text-outline" size={14} color="#FFFFFF" />
											<Text style={styles.createPostButtonText}>View</Text>
										</View>
									</View>
									<View style={styles.postsCard}>
										{postsLoading && profilePosts.length === 0 ? (
											<View style={styles.postsLoadingWrap}>
												<ActivityIndicator size="small" color="#31429B" />
												<Text style={styles.postsLoadingText}>Loading posts...</Text>
											</View>
										) : profilePosts.length === 0 ? (
											<Text style={styles.emptyPostsText}>No posts yet.</Text>
										) : (
											profilePosts.map((post) => {
												const isRepost = post.feed_type === 'repost';
												const originalCaption = post.original_post?.caption ?? '';
												const postImages = post.images ?? [];

												return (
													<View key={post.feed_id ?? `${post.feed_type}-${post.id}-${post.created_at}`} style={styles.profilePostItem}>
														<View style={styles.profilePostHeaderRow}>
															<View style={[
																styles.profilePostTypePill,
																isRepost ? styles.profileRepostPill : styles.profilePostPill,
															]}>
																<Ionicons
																	name={isRepost ? 'repeat' : 'document-text-outline'}
																	size={12}
																	color={isRepost ? '#15803D' : '#31429B'}
																/>
																<Text style={[
																styles.profilePostTypeText,
																isRepost ? styles.profileRepostTypeText : null,
															]}>
																	{isRepost ? 'Repost' : 'Post'}
																</Text>
															</View>

															<Text style={styles.profilePostTime}>{new Date(post.created_at).toLocaleString()}</Text>
														</View>

														{post.caption ? <Text style={styles.profilePostCaption}>{post.caption}</Text> : null}

														{isRepost ? (
															<View style={styles.profileOriginalWrap}>
																<Text style={styles.profileOriginalLabel}>Original by {getPostAuthorName({ alumni: post.original_post?.alumni })}</Text>
																{originalCaption ? <Text style={styles.profileOriginalCaption}>{originalCaption}</Text> : null}
															</View>
														) : null}

														{postImages.length > 0 ? renderProfilePostImages(postImages) : null}

														<View style={styles.profilePostMetricsRow}>
															<Text style={styles.profilePostMetricText}>{post.reaction_count ?? 0} reacts</Text>
															<Text style={styles.profilePostMetricText}>{post.comment_count ?? 0} comments</Text>
															<Text style={styles.profilePostMetricText}>{post.repost_count ?? 0} reposts</Text>
														</View>
													</View>
												);
											})
										)}
									</View>
								</View>
						</>
					)}
				</ScrollView>
			</View>
		</SafeAreaView>
	);
};

export default ProfileViewScreen;
