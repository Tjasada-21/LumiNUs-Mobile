import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Animated, Dimensions, Easing, Image, Modal, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';
import BrandHeader from '../components/BrandHeader';
import styles from '../styles/UserFeedScreen.styles';
import { getAuthToken } from '../services/authStorage';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const MAX_ZOOM_SCALE = 2.5;

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const getTouchDistance = (touches) => {
	if (!touches || touches.length < 2) {
		return 0;
	}

	const [firstTouch, secondTouch] = touches;
	const deltaX = firstTouch.pageX - secondTouch.pageX;
	const deltaY = firstTouch.pageY - secondTouch.pageY;

	return Math.sqrt((deltaX * deltaX) + (deltaY * deltaY));
};

const ZoomableViewer = ({ imageUri, visible, onRequestClose }) => {
	const scale = useRef(new Animated.Value(1)).current;
	const zoomedInRef = useRef(false);
	const lastTapRef = useRef(0);
	const pinchStartDistanceRef = useRef(0);
	const pinchStartScaleRef = useRef(1);
	const isPinchingRef = useRef(false);

	useEffect(() => {
		if (!visible) {
			scale.setValue(1);
			zoomedInRef.current = false;
		}
	}, [scale, visible]);

	const handleImageTap = () => {
		const now = Date.now();
		const isDoubleTap = now - lastTapRef.current < 300;
		lastTapRef.current = now;

		if (!isDoubleTap) {
			return;
		}

		const nextZoomedState = !zoomedInRef.current;
		zoomedInRef.current = nextZoomedState;

		Animated.spring(scale, {
			toValue: nextZoomedState ? MAX_ZOOM_SCALE : 1,
			useNativeDriver: true,
			bounciness: 4,
		}).start();
	};

	const handleTouchStart = (event) => {
		const touches = event.nativeEvent.touches ?? [];

		if (touches.length >= 2) {
			isPinchingRef.current = true;
			pinchStartDistanceRef.current = getTouchDistance(touches);
			scale.stopAnimation((currentScale) => {
				pinchStartScaleRef.current = currentScale;
			});
		}
	};

	const handleTouchMove = (event) => {
		const touches = event.nativeEvent.touches ?? [];

		if (touches.length >= 2) {
			const currentDistance = getTouchDistance(touches);
			const startDistance = pinchStartDistanceRef.current;

			if (!startDistance) {
				pinchStartDistanceRef.current = currentDistance;
				return;
			}

			const distanceScale = currentDistance / startDistance;
			const nextScale = clamp(pinchStartScaleRef.current * distanceScale, 1, MAX_ZOOM_SCALE);
			scale.setValue(nextScale);
			zoomedInRef.current = nextScale > 1;
		}
	};

	const handleTouchEnd = (event) => {
		const touches = event.nativeEvent.touches ?? [];

		if (touches.length < 2) {
			isPinchingRef.current = false;
			pinchStartDistanceRef.current = 0;
			pinchStartScaleRef.current = 1;

			if (!zoomedInRef.current) {
				scale.setValue(1);
			}
		}
	};

	if (!visible || !imageUri) {
		return null;
	}

	return (
		<Modal transparent visible={visible} animationType="fade" onRequestClose={onRequestClose}>
			<View style={styles.viewerBackdrop}>
				<Pressable style={StyleSheet.absoluteFillObject} onPress={onRequestClose} />

				<View style={styles.viewerContent}>
					<Pressable
						style={styles.viewerImagePressable}
						onPress={handleImageTap}
						onTouchStart={handleTouchStart}
						onTouchMove={handleTouchMove}
						onTouchEnd={handleTouchEnd}
						onTouchCancel={handleTouchEnd}
					>
						<Animated.Image
							source={{ uri: imageUri }}
							style={[
								styles.viewerImage,
								{
									transform: [{ scale }],
									width: SCREEN_WIDTH * 0.92,
									height: SCREEN_HEIGHT * 0.72,
								},
							]}
							resizeMode="contain"
						/>
					</Pressable>

					<Pressable style={styles.viewerCloseButton} onPress={onRequestClose}>
						<Ionicons name="close" size={22} color="#FFFFFF" />
					</Pressable>
				</View>
			</View>
		</Modal>
	);
};

const UserFeedScreen = ({ navigation }) => {
	// SECTION: Screen state
	const [userData, setUserData] = useState(null);
	const [posts, setPosts] = useState([]);
	const [isLoadingPosts, setIsLoadingPosts] = useState(true);
	const [isRefreshingPosts, setIsRefreshingPosts] = useState(false);
	const [postImageRatios, setPostImageRatios] = useState({});
	const [viewerVisible, setViewerVisible] = useState(false);
	const [viewerImages, setViewerImages] = useState([]);
	const [viewerIndex, setViewerIndex] = useState(0);
	const [feedError, setFeedError] = useState('');
	const [reactionPulsePostId, setReactionPulsePostId] = useState(null);
	const [commentsVisible, setCommentsVisible] = useState(false);
	const [activeCommentPost, setActiveCommentPost] = useState(null);
	const [commentDraft, setCommentDraft] = useState('');
	const [comments, setComments] = useState([]);
	const [commentsLoading, setCommentsLoading] = useState(false);
	const [commentsError, setCommentsError] = useState('');
	const reactionPulseScale = useRef(new Animated.Value(1)).current;

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

	const fetchPosts = useCallback(async ({ showLoadingState = false } = {}) => {
		try {
			if (showLoadingState) {
				setIsRefreshingPosts(true);
			} else {
				setIsLoadingPosts(true);
			}

			setFeedError('');

			const token = await getAuthToken();

			if (!token) {
				return;
			}

			const response = await api.get('/posts', {
				headers: { Authorization: `Bearer ${token}` },
			});

			setPosts(response.data?.posts ?? []);
		} catch (error) {
			console.error('Failed to fetch feed posts:', error);
			setFeedError('Unable to load posts right now.');
		} finally {
			setIsLoadingPosts(false);
			setIsRefreshingPosts(false);
		}
	}, []);

	useFocusEffect(
		useCallback(() => {
			fetchPosts();
		}, [fetchPosts])
	);

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

	const renderPostAuthorName = (post) => {
		const firstName = post?.alumni?.first_name ?? '';
		const lastName = post?.alumni?.last_name ?? '';

		return [firstName, lastName].filter(Boolean).join(' ').trim() || 'Alumni';
	};

	const renderPostAvatarUri = (post) => {
		if (post?.alumni?.alumni_photo) {
			return post.alumni.alumni_photo;
		}

		const displayName = renderPostAuthorName(post);
		return `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=31429B&color=fff`;
	};

	const renderPostImageUri = (image) => image?.image_url ?? image?.image_path ?? '';

	const getPostImageKey = (postId, image, imageIndex) => image.id ?? `${postId}-${imageIndex}`;

	const updatePostImageRatio = useCallback((imageKey, width, height) => {
		if (!width || !height) {
			return;
		}

		const nextRatio = width / height;

		setPostImageRatios((currentRatios) => {
			if (currentRatios[imageKey] === nextRatio) {
				return currentRatios;
			}

			return {
				...currentRatios,
				[imageKey]: nextRatio,
			};
		});
	}, []);

	const renderPostImage = (postId, image, imageIndex, imageStyle) => {
		const imageKey = getPostImageKey(postId, image, imageIndex);

		return (
			<Image
				source={{ uri: renderPostImageUri(image) }}
				style={[styles.postMediaImage, imageStyle]}
				resizeMode="contain"
				onLoad={(event) => {
					const { width, height } = event.nativeEvent.source;
					updatePostImageRatio(imageKey, width, height);
				}}
			/>
		);
	};

	const renderOverlayCount = (remainingCount) => {
		if (remainingCount <= 0) {
			return null;
		}

		return (
			<View style={styles.postImageOverlay}>
				<Text style={styles.postImageOverlayText}>+{remainingCount}</Text>
			</View>
		);
	};

	const openImageViewer = (postImages, imageIndex) => {
		setViewerImages(postImages.map((image) => ({ uri: renderPostImageUri(image) })));
		setViewerIndex(imageIndex);
		setViewerVisible(true);
	};

	const handlePostComment = useCallback((post) => {
		setActiveCommentPost(post);
		setCommentDraft('');
		setComments([]);
		setCommentsError('');
		setCommentsVisible(true);
	}, []);

	const closeCommentsModal = () => {
		setCommentsVisible(false);
		setActiveCommentPost(null);
		setCommentDraft('');
	};

	const handleSubmitComment = () => {
		const trimmedComment = commentDraft.trim();

		if (!trimmedComment || !activeCommentPost) {
			return;
		}

		const pendingCommentId = `temp-${Date.now()}`;
		const pendingComment = {
			id: pendingCommentId,
			comment: trimmedComment,
			created_at: new Date().toISOString(),
			is_pending: true,
			alumni: {
				id: userData?.id,
				first_name: userData?.first_name,
				last_name: userData?.last_name,
				alumni_photo: userData?.alumni_photo,
			},
		};

		setComments((currentComments) => ([pendingComment, ...currentComments]));
		setPosts((currentPosts) => currentPosts.map((currentPost) => {
			if (currentPost.id !== activeCommentPost.id) {
				return currentPost;
			}

			return {
				...currentPost,
				comment_count: (currentPost.comment_count ?? 0) + 1,
			};
		}));
		setCommentDraft('');

		api.post(`/posts/${activeCommentPost.id}/comments`, { comment: trimmedComment })
			.then((response) => {
				const savedComment = response.data?.comment;

				if (!savedComment) {
					return;
				}

				setComments((currentComments) => currentComments.map((comment) => (
					comment.id === pendingCommentId ? savedComment : comment
				)));

				setPosts((currentPosts) => currentPosts.map((currentPost) => {
					if (currentPost.id !== activeCommentPost.id) {
						return currentPost;
					}

					return {
						...currentPost,
						comment_count: savedComment.comment_count ?? currentPost.comment_count ?? 0,
					};
				}));
			})
			.catch((error) => {
				console.error('Failed to save comment:', error);
				setComments((currentComments) => currentComments.filter((comment) => comment.id !== pendingCommentId));
				setPosts((currentPosts) => currentPosts.map((currentPost) => {
					if (currentPost.id !== activeCommentPost.id) {
						return currentPost;
					}

					return {
						...currentPost,
						comment_count: Math.max(0, (currentPost.comment_count ?? 1) - 1),
					};
				}));
				Alert.alert('Comments', 'Unable to post your comment right now.');
			});
	};

	useEffect(() => {
		if (!commentsVisible || !activeCommentPost) {
			return;
		}

		let isMounted = true;

		const fetchComments = async () => {
			try {
				setCommentsLoading(true);
				setCommentsError('');

				const response = await api.get(`/posts/${activeCommentPost.id}/comments`);

				if (!isMounted) {
					return;
				}

				setComments(response.data?.comments ?? []);
			} catch (error) {
				if (isMounted) {
					console.error('Failed to fetch comments:', error);
					setCommentsError('Unable to load comments right now.');
				}
			} finally {
				if (isMounted) {
					setCommentsLoading(false);
				}
			}
		};

		fetchComments();

		return () => {
			isMounted = false;
		};
	}, [activeCommentPost, commentsVisible]);

	const renderCommentAuthorName = (comment) => {
		const firstName = comment?.alumni?.first_name ?? '';
		const lastName = comment?.alumni?.last_name ?? '';

		return [firstName, lastName].filter(Boolean).join(' ').trim() || 'Alumni';
	};

	const renderCommentAvatarUri = (comment) => {
		if (comment?.alumni?.alumni_photo) {
			return comment.alumni.alumni_photo;
		}

		const displayName = renderCommentAuthorName(comment);
		return `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=31429B&color=fff`;
	};

	const playReactionPulse = (postId) => {
		setReactionPulsePostId(postId);

		reactionPulseScale.stopAnimation();
		reactionPulseScale.setValue(0.94);

		Animated.sequence([
			Animated.timing(reactionPulseScale, {
				toValue: 1.08,
				duration: 120,
				easing: Easing.out(Easing.quad),
				useNativeDriver: true,
			}),
			Animated.spring(reactionPulseScale, {
				toValue: 1,
				tension: 140,
				friction: 14,
				useNativeDriver: true,
			}),
		]).start(() => {
			setReactionPulsePostId((currentPostId) => (currentPostId === postId ? null : currentPostId));
		});
	};

	const handlePostReaction = async (post) => {
		playReactionPulse(post.id);

		const token = await getAuthToken();

		if (!token) {
			return;
		}

		const nextReaction = post.my_reaction ? null : 'like';
		const nextReactionCount = (post.reaction_count ?? 0) + (nextReaction ? 1 : -1);

		setPosts((currentPosts) => currentPosts.map((currentPost) => {
			if (currentPost.id !== post.id) {
				return currentPost;
			}

			return {
				...currentPost,
				my_reaction: nextReaction,
				reaction_count: Math.max(0, nextReactionCount),
			};
		}));

		try {
			const response = await api.post(
				`/posts/${post.id}/reactions`,
				{ reaction: 'like' },
				{ headers: { Authorization: `Bearer ${token}` } }
			);

			setPosts((currentPosts) => currentPosts.map((currentPost) => {
				if (currentPost.id !== post.id) {
					return currentPost;
				}

				return {
					...currentPost,
					reaction_count: response.data?.reaction_count ?? currentPost.reaction_count ?? 0,
					my_reaction: response.data?.my_reaction ?? null,
				};
			}));
		} catch (error) {
			console.error('Failed to react to post:', error);

			setPosts((currentPosts) => currentPosts.map((currentPost) => {
				if (currentPost.id !== post.id) {
					return currentPost;
				}

				return {
					...currentPost,
					my_reaction: post.my_reaction ?? null,
					reaction_count: post.reaction_count ?? 0,
				};
			}));
		} finally {
		}
	};

	const renderPressableImage = (postId, postImages, image, imageIndex, imageStyle) => (
		<Pressable style={styles.postImagePressable} onPress={() => openImageViewer(postImages, imageIndex)}>
			{renderPostImage(postId, image, imageIndex, imageStyle)}
		</Pressable>
	);

	const renderPostImageLayout = (postId, postImages) => {
		if (postImages.length === 1) {
			const imageKey = getPostImageKey(postId, postImages[0], 0);
			const singleRatio = postImageRatios[imageKey] ?? 1.2;

			return (
				<View style={[styles.postSingleImageWrap, { aspectRatio: singleRatio }]}>
					{renderPressableImage(postId, postImages, postImages[0], 0, styles.postSingleImage)}
				</View>
			);
		}

		if (postImages.length === 2) {
			return (
				<View style={styles.postTwoGrid}>
					<View
						style={[
							styles.postTwoPrimaryTile,
							{ aspectRatio: postImageRatios[getPostImageKey(postId, postImages[0], 0)] ?? 1.05 },
						]}
					>
						{renderPressableImage(postId, postImages, postImages[0], 0, styles.postCollageImage)}
					</View>
					<View
						style={[
							styles.postTwoSecondaryTile,
							{ aspectRatio: postImageRatios[getPostImageKey(postId, postImages[1], 1)] ?? 0.95 },
						]}
					>
						{renderPressableImage(postId, postImages, postImages[1], 1, styles.postCollageImage)}
					</View>
				</View>
			);
		}

		if (postImages.length === 3) {
			const leftImageKey = getPostImageKey(postId, postImages[0], 0);
			const rightTopImageKey = getPostImageKey(postId, postImages[1], 1);
			const rightBottomImageKey = getPostImageKey(postId, postImages[2], 2);

			return (
				<View style={styles.postThreeCollage}>
					<View
						style={[
							styles.postThreeLeftTile,
							{ aspectRatio: postImageRatios[leftImageKey] ?? 0.92 },
						]}
					>
						{renderPressableImage(postId, postImages, postImages[0], 0, styles.postCollageImage)}
					</View>
					<View style={styles.postThreeRightColumn}>
						<View
							style={[
								styles.postThreeRightTile,
								{ aspectRatio: postImageRatios[rightTopImageKey] ?? 1.05 },
							]}
						>
							{renderPressableImage(postId, postImages, postImages[1], 1, styles.postCollageImage)}
						</View>
						<View
							style={[
								styles.postThreeRightTile,
								{ aspectRatio: postImageRatios[rightBottomImageKey] ?? 1.05 },
							]}
						>
							{renderPressableImage(postId, postImages, postImages[2], 2, styles.postCollageImage)}
						</View>
					</View>
				</View>
			);
		}

		if (postImages.length === 4) {
			const leadImageKey = getPostImageKey(postId, postImages[0], 0);
			return (
				<View style={styles.postFourCollage}>
					<View
						style={[
							styles.postFourLeadTile,
							{ aspectRatio: postImageRatios[leadImageKey] ?? 1 },
						]}
					>
						{renderPressableImage(postId, postImages, postImages[0], 0, styles.postCollageImage)}
					</View>
					<View style={styles.postFourSideColumn}>
						{postImages.slice(1, 4).map((image, imageIndex) => {
							const actualIndex = imageIndex + 1;
							const tileKey = getPostImageKey(postId, image, actualIndex);
							const isLastVisibleTile = actualIndex === 3;

							return (
								<View
									key={tileKey}
									style={[
										styles.postFourSideTile,
										{ aspectRatio: postImageRatios[tileKey] ?? 1.02 },
									]}
								>
									{renderPressableImage(postId, postImages, image, actualIndex, styles.postCollageImage)}
									{isLastVisibleTile ? renderOverlayCount(0) : null}
								</View>
							);
						})}
					</View>
				</View>
			);
		}

		const remainingCount = Math.max(postImages.length - 4, 0);

		return (
			<View style={styles.postFivePlusGrid}>
				{postImages.slice(0, 4).map((image, imageIndex) => {
					const tileKey = getPostImageKey(postId, image, imageIndex);
					const isLastVisibleTile = imageIndex === 3;

					return (
						<View key={tileKey} style={styles.postFivePlusTile}>
							{renderPressableImage(postId, postImages, image, imageIndex, styles.postCollageImage)}
							{isLastVisibleTile ? renderOverlayCount(remainingCount) : null}
						</View>
					);
				})}
			</View>
		);
	};

	const handleRefreshPosts = () => {
		fetchPosts({ showLoadingState: true });
	};

	return (
		<SafeAreaView style={styles.safeArea} edges={['top']}>
			<View style={styles.container}>
				<BrandHeader />

				{/* SECTION: Feed composer */}
				<ScrollView
					showsVerticalScrollIndicator={false}
					contentContainerStyle={styles.content}
					refreshControl={
						<RefreshControl
							refreshing={isRefreshingPosts}
							onRefresh={handleRefreshPosts}
							tintColor="#31429B"
							colors={['#31429B']}
						/>
					}
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
							<Pressable style={styles.composeBubble} onPress={() => navigation.navigate('CreatePostScreen')}>
								<Image
									source={{ uri: alumniPhotoUri }}
									style={styles.composeAvatar}
								/>
								<Text style={styles.composePrompt}>What's on your mind?</Text>
								<View style={styles.sendButton}>
									<Ionicons name="send" size={20} color="#31429B" />
								</View>
							</Pressable>

							
						</View>

						{/* <View style={styles.actionRow}>
							<View style={styles.actionChip}>
								<Ionicons name="image-outline" size={13} color="#31429B" />
								<Text style={styles.actionChipText}>Add Photos/Videos</Text>
							</View>

							<View style={styles.actionChip}>
								<Ionicons name="earth-outline" size={13} color="#31429B" />
								<Text style={styles.actionChipText}>Shared to Public</Text>
							</View>
						</View> */}
					</View>

					<View style={styles.feedSection}>
						<View style={styles.feedHeaderRow}>
							<Text style={styles.feedTitle}>Latest Posts</Text>
							<Text style={styles.feedCount}>{posts.length} posts</Text>
						</View>

						{isLoadingPosts ? (
							<View style={styles.feedStateCard}>
								<ActivityIndicator size="small" color="#31429B" />
								<Text style={styles.feedStateText}>Loading posts...</Text>
							</View>
						) : feedError ? (
							<View style={styles.feedStateCard}>
								<Ionicons name="alert-circle-outline" size={22} color="#B42318" />
								<Text style={styles.feedStateText}>{feedError}</Text>
							</View>
						) : posts.length === 0 ? (
							<View style={styles.feedStateCard}>
								<Ionicons name="chatbubble-ellipses-outline" size={22} color="#8A94A6" />
								<Text style={styles.feedStateText}>No posts yet.</Text>
							</View>
						) : (
							posts.map((post) => {
								const authorName = renderPostAuthorName(post);
								const avatarUri = renderPostAvatarUri(post);
								const postImages = post.images ?? [];

								return (
									<View key={post.id} style={styles.postCard}>
										<View style={styles.postHeader}>
											<Image source={{ uri: avatarUri }} style={styles.postAvatar} />
											<View style={styles.postHeaderTextWrap}>
												<Text style={styles.postAuthorName}>{authorName}</Text>
												<Text style={styles.postMeta}>{new Date(post.created_at).toLocaleString()}</Text>
											</View>
											<View style={styles.postStatusPill}>
												<Text style={styles.postStatusText}>Public</Text>
											</View>
										</View>

										{post.caption ? <Text style={styles.postCaption}>{post.caption}</Text> : null}

										{postImages.length > 0 ? renderPostImageLayout(post.id, postImages) : null}

										<View style={styles.postReactionRow}>
											<Pressable style={styles.postCommentButton} onPress={() => handlePostComment(post)}>
												<Ionicons name="chatbubble-outline" size={16} color="#56607A" />
												<Text style={styles.postActionButtonText}>Comment</Text>
												<Text style={styles.postActionCountText}>{post.comment_count ?? 0}</Text>
											</Pressable>

											<Pressable
												style={[
													styles.postReactionButton,
													post.my_reaction ? styles.postReactionButtonActive : null,
												]}
												onPress={() => handlePostReaction(post)}
											>
												<Animated.View
													style={{
														flexDirection: 'row',
														alignItems: 'center',
														gap: 6,
														transform: [{ scale: reactionPulsePostId === post.id ? reactionPulseScale : 1 }],
													}}
												>
													<Ionicons
														name={post.my_reaction ? 'heart' : 'heart-outline'}
														size={16}
														color={post.my_reaction ? '#D92D20' : '#31429B'}
													/>
													<Text style={[
														styles.postReactionButtonText,
														post.my_reaction ? styles.postReactionButtonTextActive : null,
													]}>
														{post.my_reaction ? 'Liked' : 'Like'}
													</Text>
													<Text style={styles.postActionCountText}>
														{post.reaction_count ?? 0}
													</Text>
												</Animated.View>
											</Pressable>
										</View>
									</View>
								);
							})
						)}

					</View>
					<View style={styles.emptySpace} />
				</ScrollView>

				<ZoomableViewer
					imageUri={viewerImages[viewerIndex]?.uri ?? ''}
					visible={viewerVisible}
					onRequestClose={() => setViewerVisible(false)}
				/>

				<Modal
					transparent
					visible={commentsVisible}
					animationType="slide"
					onRequestClose={closeCommentsModal}
				>
					<View style={styles.commentsModalBackdrop}>
						<Pressable style={StyleSheet.absoluteFillObject} onPress={closeCommentsModal} />

						<View style={styles.commentsSheet}>
							<View style={styles.commentsHeaderRow}>
								<View style={{ flex: 1, paddingRight: 12 }}>
									<Text style={styles.commentsTitle}>Comments</Text>
									<Text style={styles.commentsSubtitle} numberOfLines={1}>
										{activeCommentPost ? renderPostAuthorName(activeCommentPost) : 'Selected post'}
									</Text>
								</View>

								<Pressable style={styles.commentsCloseButton} onPress={closeCommentsModal}>
									<Ionicons name="close" size={20} color="#24346F" />
								</Pressable>
							</View>

							<View style={styles.commentsList}>
								{commentsLoading ? (
									<View style={styles.commentsEmptyState}>
										<ActivityIndicator size="small" color="#31429B" />
										<Text style={styles.commentsEmptyText}>Loading comments...</Text>
									</View>
								) : commentsError ? (
									<View style={styles.commentsEmptyState}>
										<Ionicons name="alert-circle-outline" size={26} color="#B42318" />
										<Text style={styles.commentsEmptyText}>{commentsError}</Text>
									</View>
								) : comments.length === 0 ? (
									<View style={styles.commentsEmptyState}>
										<Ionicons name="chatbubble-ellipses-outline" size={26} color="#8A94A6" />
										<Text style={styles.commentsEmptyText}>No comments loaded yet.</Text>
									</View>
								) : (
									comments.map((comment) => (
										<View key={comment.id} style={styles.commentItem}>
											<Image source={{ uri: renderCommentAvatarUri(comment) }} style={styles.commentAvatar} />
											<View style={styles.commentBubble}>
												<View style={styles.commentBubbleHeader}>
													<Text style={styles.commentAuthorName}>{renderCommentAuthorName(comment)}</Text>
													<Text style={styles.commentTimestamp}>{new Date(comment.created_at).toLocaleString()}</Text>
												</View>
												<Text style={styles.commentText}>{comment.comment}</Text>
											</View>
										</View>
									))
								)}
							</View>

							<View style={styles.commentComposer}>
								<View style={styles.commentInputWrap}>
									<TextInput
										value={commentDraft}
										onChangeText={setCommentDraft}
										placeholder="Write a comment..."
										placeholderTextColor="#8A94A6"
										style={styles.commentInput}
										multiline
									/>

									<Pressable
										style={[
											styles.commentSendButtonInside,
											!commentDraft.trim() ? styles.commentSendButtonDisabled : null,
										]}
										onPress={handleSubmitComment}
										disabled={!commentDraft.trim()}
									>
										<Ionicons name="send" size={16} color="#FFFFFF" />
									</Pressable>
								</View>
							</View>
						</View>
					</View>
				</Modal>
			</View>
		</SafeAreaView>
	);
};

export default UserFeedScreen;
