import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Dimensions, Easing, Image, Modal, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';
import BrandHeader from '../components/BrandHeader';
import styles from '../styles/UserFeedScreen.styles';
import { getAuthToken } from '../services/authStorage';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const MAX_ZOOM_SCALE = 2.5;
const VIEWER_IMAGE_WIDTH = SCREEN_WIDTH * 0.92;
const VIEWER_IMAGE_HEIGHT = SCREEN_HEIGHT * 0.72;
const VIEWER_ITEM_HEIGHT = VIEWER_IMAGE_HEIGHT + 24;

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

const ZoomableViewer = ({ images = [], initialIndex = 0, visible, onRequestClose }) => {
	const pagerRef = useRef(null);
	const scale = useRef(new Animated.Value(1)).current;
	const zoomedInRef = useRef(false);
	const lastTapRef = useRef(0);
	const pinchStartDistanceRef = useRef(0);
	const pinchStartScaleRef = useRef(1);
	const isPinchingRef = useRef(false);
	const resolvedImages = images.filter((image) => Boolean(image?.uri));

	useEffect(() => {
		if (!visible) {
			scale.setValue(1);
			zoomedInRef.current = false;
			return;
		}

		const clampedInitialIndex = clamp(initialIndex, 0, Math.max(resolvedImages.length - 1, 0));

		requestAnimationFrame(() => {
			pagerRef.current?.scrollTo({
				y: clampedInitialIndex * VIEWER_ITEM_HEIGHT,
				animated: false,
			});
		});
	}, [initialIndex, resolvedImages.length, scale, visible]);

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

	if (!visible || resolvedImages.length === 0) {
		return null;
	}

	return (
		<Modal transparent visible={visible} animationType="fade" onRequestClose={onRequestClose}>
			<View style={styles.viewerBackdrop}>
				<Pressable style={StyleSheet.absoluteFillObject} onPress={onRequestClose} />

				<View style={styles.viewerContent}>
					<ScrollView
						ref={pagerRef}
						showsVerticalScrollIndicator={false}
						style={styles.viewerPager}
						contentContainerStyle={styles.viewerScrollContent}
					>
						{resolvedImages.map((image, index) => {
							const imageKey = image?.uri ?? String(index);

							return (
								<View key={imageKey} style={styles.viewerScrollItem}>
									<Pressable
										style={styles.viewerImagePressable}
										onPress={handleImageTap}
										onTouchStart={handleTouchStart}
										onTouchMove={handleTouchMove}
										onTouchEnd={handleTouchEnd}
										onTouchCancel={handleTouchEnd}
									>
										<Animated.Image
											source={{ uri: image.uri }}
											style={[
												styles.viewerImage,
												{
													transform: [{ scale }],
													width: VIEWER_IMAGE_WIDTH,
													height: VIEWER_IMAGE_HEIGHT,
												},
											]}
											resizeMode="contain"
										/>
									</Pressable>
								</View>
							);
						})}
					</ScrollView>

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
	const [repostComposerVisible, setRepostComposerVisible] = useState(false);
	const [activeRepostPost, setActiveRepostPost] = useState(null);
	const [repostCaptionDraft, setRepostCaptionDraft] = useState('');
	const [themedAlertState, setThemedAlertState] = useState({
		visible: false,
		title: '',
		message: '',
		actions: [],
	});
	const [searchQuery, setSearchQuery] = useState('');
	const [searchResults, setSearchResults] = useState([]);
	const [isSearching, setIsSearching] = useState(false);
	const reactionPulseScale = useRef(new Animated.Value(1)).current;

	const closeThemedAlert = useCallback(() => {
		setThemedAlertState((currentState) => ({
			...currentState,
			visible: false,
		}));
	}, []);

	const showThemedAlert = useCallback(({ title, message, actions }) => {
		const safeActions = Array.isArray(actions) && actions.length > 0
			? actions
			: [{ text: 'OK' }];

		setThemedAlertState({
			visible: true,
			title,
			message,
			actions: safeActions,
		});
	}, []);

	const handleThemedAlertAction = (action) => {
		closeThemedAlert();

		if (typeof action?.onPress === 'function') {
			action.onPress();
		}
	};

	const handleSearch = useCallback(async (query) => {
		setSearchQuery(query);

		if (query.trim().length < 2) {
			setSearchResults([]);
			return;
		}

		try {
			setIsSearching(true);
			const token = await getAuthToken();

			if (!token) {
				return;
			}

			const response = await api.get('/alumni/search', {
				headers: { Authorization: `Bearer ${token}` },
				params: { q: query },
			});

			setSearchResults(response.data?.results ?? []);
		} catch (error) {
			console.error('Failed to search alumni:', error);
			setSearchResults([]);
		} finally {
			setIsSearching(false);
		}
	}, []);

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

	const getFeedItemKey = (post) => post.feed_id ?? `post-${post.id}`;

	const getRelativeTimeLabel = (dateValue) => {
		if (!dateValue) {
			return '';
		}

		const date = new Date(dateValue);
		if (Number.isNaN(date.getTime())) {
			return '';
		}

		const elapsedMs = Date.now() - date.getTime();
		const elapsedSeconds = Math.max(1, Math.floor(elapsedMs / 1000));
		const elapsedMinutes = Math.floor(elapsedSeconds / 60);
		const elapsedHours = Math.floor(elapsedMinutes / 60);
		const elapsedDays = Math.floor(elapsedHours / 24);

		if (elapsedDays >= 7) {
			return `${Math.floor(elapsedDays / 7)}w`;
		}

		if (elapsedDays >= 1) {
			return `${elapsedDays}d`;
		}

		if (elapsedHours >= 1) {
			return `${elapsedHours}h`;
		}

		if (elapsedMinutes >= 1) {
			return `${elapsedMinutes}m`;
		}

		return `${elapsedSeconds}s`;
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

	const renderOverlayCount = (remainingCount, onPress) => {
		if (remainingCount <= 0) {
			return null;
		}

		return (
			<Pressable style={styles.postImageOverlay} onPress={onPress}>
				<Text style={styles.postImageOverlayText}>+{remainingCount}</Text>
			</Pressable>
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
				showThemedAlert({
					title: 'Comments',
					message: 'Unable to post your comment right now.',
				});
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

	const handlePostRepost = async (post, caption = '') => {
		const token = await getAuthToken();

		if (!token) {
			return false;
		}

		const nextRepostState = !post.my_repost;
		const nextRepostCount = (post.repost_count ?? 0) + (nextRepostState ? 1 : -1);

		setPosts((currentPosts) => currentPosts.map((currentPost) => {
			if (currentPost.id !== post.id) {
				return currentPost;
			}

			return {
				...currentPost,
				my_repost: nextRepostState,
				repost_count: Math.max(0, nextRepostCount),
			};
		}));

		try {
			const payload = nextRepostState ? { caption } : {};

			const response = await api.post(
				`/posts/${post.id}/reposts`,
				payload,
				{ headers: { Authorization: `Bearer ${token}` } }
			);

			setPosts((currentPosts) => currentPosts.map((currentPost) => {
				if (currentPost.id !== post.id) {
					return currentPost;
				}

				return {
					...currentPost,
					repost_count: response.data?.repost_count ?? currentPost.repost_count ?? 0,
					my_repost: response.data?.my_repost ?? false,
				};
			}));

			if (response.data?.my_repost && response.data?.repost) {
				const createdRepost = response.data.repost;

				setPosts((currentPosts) => {
					const withoutDuplicateCurrentUserRepost = currentPosts.filter((currentPost) => {
						const isSameSourcePost = currentPost.id === createdRepost.id;
						const isRepostItem = currentPost.feed_type === 'repost';
						const isCurrentUserRepost = currentPost.alumni?.id === userData?.id;

						return !(isSameSourcePost && isRepostItem && isCurrentUserRepost);
					});

					return [createdRepost, ...withoutDuplicateCurrentUserRepost];
				});
			}

			if (!response.data?.my_repost) {
				setPosts((currentPosts) => currentPosts.filter((currentPost) => {
					const isSameSourcePost = currentPost.id === post.id;
					const isRepostItem = currentPost.feed_type === 'repost';
					const isCurrentUserRepost = currentPost.alumni?.id === userData?.id;

					return !(isSameSourcePost && isRepostItem && isCurrentUserRepost);
				}));
			}

			return true;
		} catch (error) {
			console.error('Failed to repost post:', error);

			setPosts((currentPosts) => currentPosts.map((currentPost) => {
				if (currentPost.id !== post.id) {
					return currentPost;
				}

				return {
					...currentPost,
					my_repost: post.my_repost ?? false,
					repost_count: post.repost_count ?? 0,
				};
			}));

			showThemedAlert({
				title: 'Repost',
				message: 'Unable to repost right now. Please try again.',
			});
			return false;
		}
	};

	const openRepostComposer = (post) => {
		if (post?.my_repost) {
			showThemedAlert({
				title: 'Remove repost?',
				message: 'This will remove your repost from the feed.',
				actions: [
					{ text: 'Cancel', style: 'cancel' },
					{
						text: 'Remove',
						style: 'destructive',
						onPress: () => {
							handlePostRepost(post);
						},
					},
				],
			});
			return;
		}

		setActiveRepostPost(post);
		setRepostCaptionDraft('');
		setRepostComposerVisible(true);
	};

	const closeRepostComposer = () => {
		setRepostComposerVisible(false);
		setActiveRepostPost(null);
		setRepostCaptionDraft('');
	};

	const submitRepostWithCaption = () => {
		if (!activeRepostPost) {
			return;
		}

		const targetPost = activeRepostPost;
		const captionToSubmit = repostCaptionDraft.trim();

		closeRepostComposer();
		handlePostRepost(targetPost, captionToSubmit);
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
							{isLastVisibleTile ? renderOverlayCount(remainingCount, () => openImageViewer(postImages, imageIndex)) : null}
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
								value={searchQuery}
								onChangeText={handleSearch}
							/>
							<Ionicons name="search-outline" size={22} color="#7A7A7A" />
						</View>
					</View>

					{searchQuery.trim().length > 0 && (
						<View style={styles.searchResultsContainer}>
							{isSearching && (
								<View style={styles.searchLoadingContainer}>
									<ActivityIndicator size="small" color="#31429B" />
									<Text style={styles.searchLoadingText}>Searching...</Text>
								</View>
							)}

							{!isSearching && searchResults.length === 0 && (
								<Text style={styles.noResultsText}>No users found</Text>
							)}

							{!isSearching && searchResults.length > 0 && (
								searchResults.map((user) => (
									<Pressable
										key={user.id}
										style={styles.searchResultItem}
										onPress={() => {
											setSearchQuery('');
											setSearchResults([]);
											if (user.id === userData?.id) {
												navigation.navigate('Profile');
											} else {
												navigation.navigate('ProfileView', { userId: user.id });
											}
										}}
									>
										<Image
											source={{ uri: user.alumni_photo || 'https://i.pravatar.cc/150?img=1' }}
											style={styles.searchResultAvatar}
										/>
										<View style={styles.searchResultInfo}>
											<Text style={styles.searchResultName}>
												{user.first_name} {user.middle_name || ''} {user.last_name}
											</Text>
										</View>
									</Pressable>
								))
							)}
						</View>
					)}

					{searchQuery.trim().length === 0 && (
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
					)}

					{searchQuery.trim().length === 0 && (
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
								const isRepostFeedItem = post.feed_type === 'repost';
								const originalPost = post.original_post ?? null;
								const originalAuthorName = renderPostAuthorName({ alumni: originalPost?.alumni });
								const originalAvatarUri = renderPostAvatarUri({ alumni: originalPost?.alumni });

								return (
									<View key={getFeedItemKey(post)} style={styles.postCard}>
										<View style={styles.postHeader}>
											<Image source={{ uri: avatarUri }} style={styles.postAvatar} />
											<View style={styles.postHeaderTextWrap}>
												<Pressable
													onPress={() => {
														if (post.alumni?.id === userData?.id) {
															navigation.navigate('Profile');
														} else {
															navigation.navigate('ProfileView', { userId: post.alumni?.id });
														}
													}}
												>
													<Text style={styles.postAuthorName}>{authorName}</Text>
												</Pressable>
												<View style={styles.postMetaRow}>
													<Text style={styles.postMeta}>{getRelativeTimeLabel(post.created_at)}</Text>
													<Text style={styles.postMetaSeparator}>•</Text>
													<Ionicons name="earth-outline" size={10} color="#7A7A7A" />
													<Text style={styles.postMeta}>Public</Text>
													{isRepostFeedItem ? (
														<>
															<Text style={styles.postMetaSeparator}>•</Text>
															<Text style={styles.postMeta}>Reposted</Text>
														</>
													) : null}
												</View>
											</View>
										</View>

										{post.caption ? <Text style={styles.postCaption}>{post.caption}</Text> : null}

										{isRepostFeedItem && originalPost ? (
											<View style={styles.repostedOriginalCard}>
												<View style={styles.repostedOriginalHeader}>
													<Image source={{ uri: originalAvatarUri }} style={styles.repostedOriginalAvatar} />
													<View style={styles.repostedOriginalTextWrap}>
														<Pressable
															onPress={() => {
																if (originalPost.alumni?.id === userData?.id) {
																	navigation.navigate('Profile');
																} else {
																	navigation.navigate('ProfileView', { userId: originalPost.alumni?.id });
																}
															}}
														>
															<Text style={styles.repostedOriginalAuthor}>{originalAuthorName}</Text>
														</Pressable>
														<View style={styles.postMetaRow}>
															<Text style={styles.postMeta}>{getRelativeTimeLabel(originalPost.created_at)}</Text>
															<Text style={styles.postMetaSeparator}>•</Text>
															<Ionicons name="earth-outline" size={10} color="#7A7A7A" />
															<Text style={styles.postMeta}>Public</Text>
														</View>
													</View>
												</View>

												{originalPost.caption ? (
													<Text style={styles.repostedOriginalCaption}>{originalPost.caption}</Text>
												) : null}
											</View>
										) : null}

										{postImages.length > 0 ? renderPostImageLayout(post.id, postImages) : null}

										<View style={styles.postReactionRow}>
												<Pressable
													style={[
														styles.postReactionButton,
														post.my_reaction ? styles.postReactionButtonActive : null,
													]}
													onPress={() => handlePostReaction(post)}
												>
													<Animated.View style={styles.postActionInline}>
														<Ionicons
															name={post.my_reaction ? 'thumbs-up' : 'thumbs-up-outline'}
															size={16}
															color={post.my_reaction ? '#D92D20' : '#31429B'}
														/>
														<Text style={styles.postActionCount}>{post.reaction_count ?? 0}</Text>
													</Animated.View>
												</Pressable>

												<Pressable style={styles.postCommentButton} onPress={() => handlePostComment(post)}>
													<View style={styles.postActionInline}>
														<Ionicons name="chatbubble-outline" size={16} color="#56607A" />
														<Text style={styles.postActionCount}>{post.comment_count ?? 0}</Text>
													</View>
												</Pressable>

												{!post.my_repost ? (
													<Pressable
														style={styles.postRepostButton}
														onPress={() => openRepostComposer(post)}
													>
														<View style={styles.postActionInline}>
															<Ionicons name="share-social-outline" size={16} color="#2F855A" />
															<Text style={styles.postActionCount}>{post.repost_count ?? 0}</Text>
														</View>
													</Pressable>
												) : null}
										</View>
									</View>
								);
							})
						)}
						</View>
					)}

					<View style={styles.emptySpace} />
				</ScrollView>

				<ZoomableViewer
					images={viewerImages}
					initialIndex={viewerIndex}
					visible={viewerVisible}
					onRequestClose={() => setViewerVisible(false)}
				/>

				<Modal
					transparent
					visible={repostComposerVisible}
					animationType="slide"
					onRequestClose={closeRepostComposer}
				>
					<View style={styles.repostModalBackdrop}>
						<Pressable style={StyleSheet.absoluteFillObject} onPress={closeRepostComposer} />

						<View style={styles.repostModalCard}>
							<Text style={styles.repostModalTitle}>Repost with your caption</Text>
							<Text style={styles.repostModalSubtitle} numberOfLines={1}>
								{activeRepostPost ? `Reposting ${renderPostAuthorName(activeRepostPost)}'s post` : 'Add context to your repost'}
							</Text>

							<TextInput
								value={repostCaptionDraft}
								onChangeText={setRepostCaptionDraft}
								placeholder="Share your thoughts..."
								placeholderTextColor="#8A94A6"
								style={styles.repostCaptionInput}
								multiline
								textAlignVertical="top"
							/>

							<View style={styles.repostModalActionsRow}>
								<Pressable
									style={styles.repostCancelButton}
									onPress={closeRepostComposer}
								>
									<Text style={styles.repostCancelButtonText}>Cancel</Text>
								</Pressable>

								<Pressable
									style={[
										styles.repostSubmitButton,
									]}
									onPress={submitRepostWithCaption}
								>
									<Text style={styles.repostSubmitButtonText}>Repost</Text>
								</Pressable>
							</View>
						</View>
					</View>
				</Modal>

				<Modal
					transparent
					visible={themedAlertState.visible}
					animationType="fade"
					onRequestClose={closeThemedAlert}
				>
					<View style={styles.themedAlertBackdrop}>
						<Pressable style={StyleSheet.absoluteFillObject} onPress={closeThemedAlert} />

						<View style={styles.themedAlertCard}>
							<Text style={styles.themedAlertTitle}>{themedAlertState.title}</Text>
							<Text style={styles.themedAlertMessage}>{themedAlertState.message}</Text>

							<View style={styles.themedAlertActionsRow}>
								{themedAlertState.actions.map((action, actionIndex) => {
									const isDestructive = action?.style === 'destructive';
									const isCancel = action?.style === 'cancel';

									return (
										<Pressable
											key={`${action.text}-${actionIndex}`}
											style={[
												styles.themedAlertButton,
												isDestructive ? styles.themedAlertButtonDestructive : null,
												isCancel ? styles.themedAlertButtonNeutral : null,
											]}
											onPress={() => handleThemedAlertAction(action)}
										>
											<Text
												style={[
													styles.themedAlertButtonText,
													isDestructive ? styles.themedAlertButtonTextDestructive : null,
													isCancel ? styles.themedAlertButtonTextNeutral : null,
												]}
											>
												{action.text}
											</Text>
										</Pressable>
									);
								})}
							</View>
						</View>
					</View>
				</Modal>

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
