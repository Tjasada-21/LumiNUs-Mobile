import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Dimensions, Easing, Image, Modal, Pressable, RefreshControl, ScrollView, StatusBar, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';
import BrandHeader from '../components/BrandHeader';
import CustomKeyboardView from '../components/CustomKeyboardView';
import styles from '../styles/UserFeedScreen.styles';
import { getAuthToken } from '../services/authStorage';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const MAX_ZOOM_SCALE = 2.5;
const VIEWER_IMAGE_WIDTH = SCREEN_WIDTH * 0.92;
const VIEWER_IMAGE_HEIGHT = SCREEN_HEIGHT * 0.72;
const MENTION_PATTERN = /(@[a-zA-Z0-9_.-]+)/g;
const SWIPE_DISMISS_THRESHOLD = 100; // pixels to swipe down to dismiss

const extractMentionQuery = (value) => {
	const text = String(value ?? '');
	const match = text.match(/(^|\s)@([a-zA-Z0-9_.-]*)$/);

	if (!match) {
		return null;
	}

	const query = match[2] ?? '';
	const mentionStart = text.length - query.length - 1;

	return {
		query,
		mentionStart,
		mentionEnd: text.length,
	};
};

const toMentionHandle = (firstName, lastName) => {
	const normalizedHandle = `${firstName ?? ''}_${lastName ?? ''}`
		.toLowerCase()
		.replace(/\s+/g, '_')
		.replace(/[^a-z0-9_.-]/g, '')
		.replace(/_+/g, '_')
		.replace(/^_+|_+$/g, '');

	return normalizedHandle || 'alumni';
};

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

const ZoomableViewer = ({
	images = [],
	initialIndex = 0,
	visible,
	post = null,
	viewerAuthorName = '',
	postAvatarUri = '',
	timeLabel = '',
	postVisibilityLabel = 'Public',
	reactionCount = 0,
	commentCount = 0,
	repostCount = 0,
	isReacted = false,
	onRequestClose,
	onAuthorPress,
	onReactionPress,
	onCommentPress,
	onRepostPress,
	onMenuPress,
}) => {
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
				x: clampedInitialIndex * SCREEN_WIDTH,
				y: 0,
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
			<StatusBar barStyle="light-content" backgroundColor="#000000" translucent />
			<View style={styles.viewerBackdrop}>
				<Pressable style={StyleSheet.absoluteFillObject} onPress={onRequestClose} />

				<View style={styles.viewerContent}>
					<ScrollView
						ref={pagerRef}
						horizontal
						pagingEnabled
						showsHorizontalScrollIndicator={false}
						style={styles.viewerPager}
						contentContainerStyle={styles.viewerScrollContent}
					>
						{resolvedImages.map((image, index) => {
							const imageKey = image?.uri ?? String(index);

							return (
								<View key={imageKey} style={styles.viewerScrollItem}>
									<View style={styles.viewerImageCard}>
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
								</View>
							);
						})}
					</ScrollView>

					{post ? (
						<View style={styles.viewerFooter} pointerEvents="box-none">
							<View style={styles.viewerAuthorCard}>
								<Pressable onPress={onAuthorPress} style={styles.viewerAuthorPressable} hitSlop={8}>
									<Image source={{ uri: postAvatarUri }} style={styles.viewerAuthorAvatar} />
								</Pressable>
								<View style={styles.viewerAuthorTextWrap}>
									<Pressable onPress={onAuthorPress} hitSlop={8}>
										<Text style={styles.viewerAuthorName}>{viewerAuthorName}</Text>
									</Pressable>
									<View style={styles.viewerAuthorMetaRow}>
										<Text style={styles.viewerAuthorMeta}>{timeLabel}</Text>
										<Text style={styles.viewerAuthorMetaSeparator}>•</Text>
										<Ionicons name="earth-outline" size={12} color="#FFFFFF" />
										<Text style={styles.viewerAuthorMeta}>{postVisibilityLabel}</Text>
									</View>
								</View>
							</View>

							{post.feed_type !== 'announcement' ? (
								<>
									<View style={styles.viewerActionsRow}>
										<Pressable style={styles.viewerActionButton} onPress={onReactionPress}>
											<Ionicons name={isReacted ? 'heart' : 'heart-outline'} size={18} color={isReacted ? '#EF4444' : '#FFFFFF'} />
											<Text style={styles.viewerActionLabel}>Like</Text>
										</Pressable>

										<Pressable style={styles.viewerActionButton} onPress={onCommentPress}>
											<Ionicons name="chatbubble-outline" size={18} color="#FFFFFF" />
											<Text style={styles.viewerActionLabel}>Comment</Text>
										</Pressable>

										<Pressable style={styles.viewerActionButton} onPress={onRepostPress}>
											<Ionicons name="share-social-outline" size={18} color="#FFFFFF" />
											<Text style={styles.viewerActionLabel}>Share</Text>
										</Pressable>
									</View>

									<View style={styles.viewerCountsRow}>
										<Text style={styles.viewerCountText}>{reactionCount} reactions</Text>
										<Text style={styles.viewerCountText}>{commentCount} comments</Text>
										<Text style={styles.viewerCountText}>{repostCount} shares</Text>
									</View>
								</>
							) : null}
						</View>
					) : null}

					<View style={styles.viewerTopBar} pointerEvents="box-none">
						<Pressable style={styles.viewerTopButton} onPress={onRequestClose} hitSlop={10}>
							<Ionicons name="close" size={26} color="#FFFFFF" />
						</Pressable>

						<Pressable style={styles.viewerTopButton} onPress={onMenuPress} hitSlop={10}>
							<Ionicons name="ellipsis-vertical" size={22} color="#FFFFFF" />
						</Pressable>
					</View>
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
	const [viewerPost, setViewerPost] = useState(null);
	const [feedError, setFeedError] = useState('');
	const [reactionPulsePostId, setReactionPulsePostId] = useState(null);
	const [commentsVisible, setCommentsVisible] = useState(false);
	const [activeCommentPost, setActiveCommentPost] = useState(null);
	const [replyingToComment, setReplyingToComment] = useState(null);
	const [commentDraft, setCommentDraft] = useState('');
	const [commentInputHeight, setCommentInputHeight] = useState(46);
	const [comments, setComments] = useState([]);
	const [commentsLoading, setCommentsLoading] = useState(false);
	const [commentsError, setCommentsError] = useState('');
	const [expandedCommentParents, setExpandedCommentParents] = useState({});
	const [expandedCaptions, setExpandedCaptions] = useState({});
	const [captionOverflowMap, setCaptionOverflowMap] = useState({});
	const [repostComposerVisible, setRepostComposerVisible] = useState(false);
	const [activeRepostPost, setActiveRepostPost] = useState(null);
	const [repostCaptionDraft, setRepostCaptionDraft] = useState('');
	const [postActionsVisible, setPostActionsVisible] = useState(false);
	const [activePostActionPost, setActivePostActionPost] = useState(null);
	const [isPostActionSaving, setIsPostActionSaving] = useState(false);
	const [isDeletingPost, setIsDeletingPost] = useState(false);
	const [themedAlertState, setThemedAlertState] = useState({
		visible: false,
		title: '',
		message: '',
		actions: [],
	});
	const [searchQuery, setSearchQuery] = useState('');
	const [searchResults, setSearchResults] = useState([]);
	const [isSearching, setIsSearching] = useState(false);
	const [connections, setConnections] = useState([]);
	const reactionPulseScale = useRef(new Animated.Value(1)).current;

	// SECTION: Rubber banding and animated refs for modals
	const postActionsTranslateY = useRef(new Animated.Value(0)).current;
	const repostComposerTranslateY = useRef(new Animated.Value(0)).current;
	const commentsTranslateY = useRef(new Animated.Value(0)).current;

	// SECTION: Swipe-to-dismiss refs and handlers
	const postActionsSwipeStartRef = useRef(0);
	const postActionsInitialYRef = useRef(0);
	const repostComposerSwipeStartRef = useRef(0);
	const repostComposerInitialYRef = useRef(0);
	const commentsSwipeStartRef = useRef(0);
	const commentsInitialYRef = useRef(0);

	// Rubber banding resistance curve: at threshold, resistance kicks in
	const applyRubberBandingOffset = (distance) => {
		const RESISTANCE_FACTOR = 0.3; // 30% movement beyond threshold
		if (distance <= 0) return distance;
		if (distance <= SWIPE_DISMISS_THRESHOLD) return distance;
		return SWIPE_DISMISS_THRESHOLD + (distance - SWIPE_DISMISS_THRESHOLD) * RESISTANCE_FACTOR;
	};

	const handlePostActionsSwipe = (evt) => {
		const currentY = evt.nativeEvent.pageY;
		if (postActionsSwipeStartRef.current === 0) {
			postActionsSwipeStartRef.current = currentY;
			postActionsInitialYRef.current = 0;
		}
		const distance = currentY - postActionsSwipeStartRef.current;
		const rubberBandedOffset = applyRubberBandingOffset(distance);
		postActionsTranslateY.setValue(rubberBandedOffset);

		if (distance > SWIPE_DISMISS_THRESHOLD && distance > 0) {
			closePostActions();
			postActionsSwipeStartRef.current = 0;
		}
	};

	const handleRepostComposerSwipe = (evt) => {
		const currentY = evt.nativeEvent.pageY;
		if (repostComposerSwipeStartRef.current === 0) {
			repostComposerSwipeStartRef.current = currentY;
			repostComposerInitialYRef.current = 0;
		}
		const distance = currentY - repostComposerSwipeStartRef.current;
		const rubberBandedOffset = applyRubberBandingOffset(distance);
		repostComposerTranslateY.setValue(rubberBandedOffset);

		if (distance > SWIPE_DISMISS_THRESHOLD && distance > 0) {
			closeRepostComposer();
			repostComposerSwipeStartRef.current = 0;
		}
	};

	const handleCommentsSwipe = (evt) => {
		const currentY = evt.nativeEvent.pageY;
		if (commentsSwipeStartRef.current === 0) {
			commentsSwipeStartRef.current = currentY;
			commentsInitialYRef.current = 0;
		}
		const distance = currentY - commentsSwipeStartRef.current;
		const rubberBandedOffset = applyRubberBandingOffset(distance);
		commentsTranslateY.setValue(rubberBandedOffset);

		if (distance > SWIPE_DISMISS_THRESHOLD && distance > 0) {
			closeCommentsModal();
			commentsSwipeStartRef.current = 0;
		}
	};

	const resetSwipeRefs = () => {
		postActionsSwipeStartRef.current = 0;
		repostComposerSwipeStartRef.current = 0;
		commentsSwipeStartRef.current = 0;
		// Snap back animations with spring effect
		Animated.spring(postActionsTranslateY, { toValue: 0, useNativeDriver: false }).start();
		Animated.spring(repostComposerTranslateY, { toValue: 0, useNativeDriver: false }).start();
		Animated.spring(commentsTranslateY, { toValue: 0, useNativeDriver: false }).start();
	};

	const repostMentionContext = useMemo(() => extractMentionQuery(repostCaptionDraft), [repostCaptionDraft]);
	const commentMentionContext = useMemo(() => extractMentionQuery(commentDraft), [commentDraft]);

	const mentionDirectory = useMemo(() => {
		return connections.map((connection) => {
			const firstName = connection?.first_name ?? '';
			const lastName = connection?.last_name ?? '';
			const name = `${firstName} ${lastName}`.trim() || 'Alumni';

			return {
				id: connection?.id,
				name,
				handle: toMentionHandle(firstName, lastName),
				avatar: connection?.alumni_photo
					? connection.alumni_photo
					: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=31429B&color=fff`,
			};
		});
	}, [connections]);

	const repostMentionSuggestions = useMemo(() => {
		if (!repostMentionContext) {
			return [];
		}

		const query = repostMentionContext.query.toLowerCase();
		return mentionDirectory
			.filter((item) => (!query ? true : item.name.toLowerCase().includes(query) || item.handle.includes(query)))
			.slice(0, 5);
	}, [mentionDirectory, repostMentionContext]);

	const commentMentionSuggestions = useMemo(() => {
		if (!commentMentionContext) {
			return [];
		}

		const query = commentMentionContext.query.toLowerCase();
		return mentionDirectory
			.filter((item) => (!query ? true : item.name.toLowerCase().includes(query) || item.handle.includes(query)))
			.slice(0, 5);
	}, [commentMentionContext, mentionDirectory]);

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

				const contactsResponse = await api.get('/contacts', {
					headers: { Authorization: `Bearer ${token}` },
				});

				setUserData(response.data?.alumni ?? null);
				setConnections(contactsResponse.data?.contacts ?? []);
			} catch (error) {
				console.error('Failed to fetch feed profile:', error);
				setConnections([]);
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

			const rawPosts = response.data?.posts ?? [];

			const mappedPosts = rawPosts.map((post) => {
				const images = Array.isArray(post.images) ? post.images.map((img) => ({
					...img,
					image_url: renderPostImageUri(img),
				})) : [];

				// also normalize any single featured image fields if present
				const normalized = { ...post, images };

				return normalized;
			});

			// Debug: log first few image URLs to help troubleshooting
			try {
				// eslint-disable-next-line no-console
				console.debug('Fetched posts image URLs:', mappedPosts.slice(0, 5).map(p => p.images.map(i => i.image_url)));
			} catch (e) {}

			setPosts(mappedPosts);
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
		const source = post?.author ?? post?.alumni ?? {};
		const firstName = source.first_name ?? '';
		const middleName = source.middle_name ?? '';
		const lastName = source.last_name ?? '';

		return [firstName, middleName, lastName].filter(Boolean).join(' ').trim() || 'Alumni';
	};

	const renderPostAvatarUri = (post) => {
		const source = post?.author ?? post?.alumni ?? {};

		if (source.alumni_photo) {
			return source.alumni_photo;
		}

		const displayName = renderPostAuthorName(post);
		return `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=31429B&color=fff`;
	};

	const getPostVisibilityLabel = (post) => {
		if (post?.is_draft) {
			return 'Draft';
		}

		const visibility = String(post?.visibility ?? 'public').toLowerCase();

		if (visibility === 'friends') {
			return 'Friends';
		}

		if (visibility === 'private') {
			return 'Private';
		}

		return 'Public';
	};

	const canManagePost = useCallback((post) => Boolean(
		userData?.id
		&& post?.feed_type === 'post'
		&& post?.alumni?.id
		&& post.alumni.id === userData.id
	), [userData?.id]);

	const openPostActions = useCallback((post) => {
		setActivePostActionPost(post);
		setPostActionsVisible(true);
	}, []);

	const closePostActions = useCallback(() => {
		if (isPostActionSaving) {
			return;
		}

		setPostActionsVisible(false);
		setActivePostActionPost(null);
	}, [isPostActionSaving]);

	const handleReportPost = useCallback(async () => {
		if (!activePostActionPost?.id) return;
		setPostActionsVisible(false);
		try {
			await api.post(`/posts/${activePostActionPost.id}/report`, { reason: 'Inappropriate' });
			showThemedAlert({ title: 'Reported', message: 'Thanks — the post has been reported.' });
		} catch (e) {
			console.warn('Report API failed', e?.message || e);
			showThemedAlert({ title: 'Error', message: 'Could not report the post.' });
		}
	}, [activePostActionPost]);

	const handleMuteAuthor = useCallback(async () => {
		if (!activePostActionPost?.alumni?.id) return;
		setPostActionsVisible(false);
		try {
			await api.post(`/users/${activePostActionPost.alumni.id}/mute`);
			showThemedAlert({ title: 'Muted', message: 'You will no longer see posts from this user.' });
		} catch (e) {
			console.warn('Mute API failed', e?.message || e);
			showThemedAlert({ title: 'Error', message: 'Could not mute the user.' });
		}
	}, [activePostActionPost]);

	const handleHidePost = useCallback(async () => {
		if (!activePostActionPost?.id) return;
		setPostActionsVisible(false);
		setPosts((current) => current.filter((p) => !(p.feed_type === 'post' && p.id === activePostActionPost.id)));
		showThemedAlert({ title: 'Hidden', message: 'This post has been hidden.' });
	}, [activePostActionPost]);

	const handleCopyLink = useCallback(async () => {
		if (!activePostActionPost?.id) return;
		const link = `${API_BASE_URL ?? ''}/posts/${activePostActionPost.id}`;
		try {
			import('expo-clipboard').then((mod) => mod.setStringAsync(link));
			showThemedAlert({ title: 'Link copied', message: 'Post link copied to clipboard.' });
		} catch (e) {
			console.warn('Copy link failed', e?.message || e);
			showThemedAlert({ title: 'Error', message: 'Could not copy link.' });
		}
	}, [activePostActionPost]);

	const syncPostInFeed = useCallback((updatedPost) => {
		if (!updatedPost?.id) {
			return;
		}

		setPosts((currentPosts) => currentPosts.map((currentPost) => {
			if (currentPost.feed_type !== 'post' || currentPost.id !== updatedPost.id) {
				return currentPost;
			}

			return {
				...currentPost,
				caption: updatedPost.caption ?? currentPost.caption,
				visibility: updatedPost.visibility ?? currentPost.visibility,
				is_draft: typeof updatedPost.is_draft === 'boolean' ? updatedPost.is_draft : currentPost.is_draft,
				images: Array.isArray(updatedPost.images) && updatedPost.images.length > 0 ? updatedPost.images : currentPost.images,
			};
		}));

		setViewerPost((currentViewerPost) => {
			if (!currentViewerPost || currentViewerPost.feed_type !== 'post' || currentViewerPost.id !== updatedPost.id) {
				return currentViewerPost;
			}

			return {
				...currentViewerPost,
				caption: updatedPost.caption ?? currentViewerPost.caption,
				visibility: updatedPost.visibility ?? currentViewerPost.visibility,
				is_draft: typeof updatedPost.is_draft === 'boolean' ? updatedPost.is_draft : currentViewerPost.is_draft,
				images: Array.isArray(updatedPost.images) && updatedPost.images.length > 0 ? updatedPost.images : currentViewerPost.images,
			};
		});
	}, []);

	const removePostFromFeed = useCallback((postId) => {
		setPosts((currentPosts) => currentPosts.filter((currentPost) => !(currentPost.feed_type === 'post' && currentPost.id === postId)));

		setViewerPost((currentViewerPost) => {
			if (!currentViewerPost || currentViewerPost.feed_type !== 'post' || currentViewerPost.id !== postId) {
				return currentViewerPost;
			}

			return null;
		});

		if (viewerPost?.feed_type === 'post' && viewerPost?.id === postId) {
			setViewerVisible(false);
			setViewerImages([]);
			setViewerIndex(0);
		}
	}, [viewerPost]);

	const updateActivePost = useCallback(async (payload, successTitle, successMessage) => {
		if (!activePostActionPost?.id || isPostActionSaving) {
			return;
		}

		try {
			setIsPostActionSaving(true);

			const token = await getAuthToken();

			if (!token) {
				showThemedAlert({
					title: 'Sign in required',
					message: 'Please sign in again before changing a post.',
				});
				return;
			}

			const response = await api.patch(
				`/posts/${activePostActionPost.id}`,
				payload,
				{ headers: { Authorization: `Bearer ${token}` } }
			);

			syncPostInFeed(response.data?.post ?? payload);
			setPostActionsVisible(false);
			setActivePostActionPost(null);
			showThemedAlert({
				title: successTitle,
				message: successMessage,
			});
		} catch (error) {
			console.error('Failed to update post:', error);
			showThemedAlert({
				title: 'Update failed',
				message: 'Unable to update the post right now.',
			});
		} finally {
			setIsPostActionSaving(false);
		}
	}, [activePostActionPost, isPostActionSaving, syncPostInFeed]);

	const handleEditActivePost = () => {
		if (!activePostActionPost) {
			return;
		}

		setPostActionsVisible(false);
		setActivePostActionPost(null);
		navigation.navigate('CreatePostScreen', { post: activePostActionPost });
	};

	const handleToggleActivePostDraft = () => {
		if (!activePostActionPost) {
			return;
		}

		updateActivePost(
			{ is_draft: !activePostActionPost.is_draft },
			activePostActionPost.is_draft ? 'Post published' : 'Draft saved',
			activePostActionPost.is_draft ? 'Your post is visible again.' : 'Your post was saved as a draft.'
		);
	};

	const handleChangeActivePostVisibility = (visibility) => {
		updateActivePost(
			{ visibility },
			'Visibility updated',
			`This post is now visible to ${getPostVisibilityLabel({ visibility })}.`
		);
	};

	const handleDeleteActivePost = () => {
		if (!activePostActionPost) {
			return;
		}

		showThemedAlert({
			title: 'Delete post?',
			message: 'This action cannot be undone.',
			actions: [
				{ text: 'Cancel', style: 'cancel' },
				{
					text: 'Delete',
					style: 'destructive',
					onPress: async () => {
						const postId = activePostActionPost.id;

						try {
							setPostActionsVisible(false);
							setActivePostActionPost(null);
							setIsDeletingPost(true);
							const token = await getAuthToken();

							if (!token) {
								setIsDeletingPost(false);
								showThemedAlert({
									title: 'Sign in required',
									message: 'Please sign in again before deleting a post.',
								});
								return;
							}

							await api.delete(`/posts/${postId}`, {
								headers: { Authorization: `Bearer ${token}` },
							});

							removePostFromFeed(postId);
							showThemedAlert({
								title: 'Post deleted',
								message: 'Your post has been removed.',
							});
						} catch (error) {
							console.error('Failed to delete post:', error);
							showThemedAlert({
								title: 'Delete failed',
								message: 'Unable to delete the post right now.',
							});
						} finally {
							setIsDeletingPost(false);
						}
					},
				},
			],
		});
	};

	const getFeedItemKey = (post) => {
		if (post?.feed_id) {
			return post.feed_id;
		}

		const feedType = post?.feed_type ?? 'post';
		return `${feedType}-${post.id}`;
	};

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

	const isCaptionExpanded = useCallback((feedItemKey) => Boolean(expandedCaptions[feedItemKey]), [expandedCaptions]);

	const markCaptionOverflow = useCallback((feedItemKey, lineCount) => {
		setCaptionOverflowMap((currentMap) => {
			if (currentMap[feedItemKey] === lineCount) {
				return currentMap;
			}

			if (lineCount <= 3) {
				const nextMap = { ...currentMap };
				delete nextMap[feedItemKey];
				return nextMap;
			}

			return {
				...currentMap,
				[feedItemKey]: lineCount,
			};
		});
	}, []);

	const handleCaptionMentionPress = useCallback((mentionText) => {
		const mentionHandle = String(mentionText ?? '').replace(/^@/, '').toLowerCase();

		if (!mentionHandle) {
			return;
		}

		const matchedConnection = mentionDirectory.find((item) => item.handle === mentionHandle);

		if (!matchedConnection?.id) {
			showThemedAlert({
				title: 'Mention unavailable',
				message: `No profile found for @${mentionHandle}.`,
			});
			return;
		}

		if (matchedConnection.id === userData?.id) {
			navigation.navigate('Profile');
		} else {
			navigation.navigate('ProfileView', { userId: matchedConnection.id });
		}
	}, [mentionDirectory, userData?.id, navigation, showThemedAlert]);

	const renderCaptionWithMentions = (caption, captionStyle) => {
		if (!caption) {
			return null;
		}

		const text = String(caption ?? '');
		const segments = text.split(MENTION_PATTERN);

		return (
			<>
				{segments.map((segment, index) => {
					const isMention = MENTION_PATTERN.test(segment);
					MENTION_PATTERN.lastIndex = 0;

					if (!isMention) {
						return (
							<Text key={`segment-${index}`} style={captionStyle}>
								{segment}
							</Text>
						);
					}

					return (
						<Text
							key={`mention-${index}-${segment}`}
							style={[captionStyle, styles.captionMention]}
							onPress={() => handleCaptionMentionPress(segment)}
						>
							{segment}
						</Text>
					);
				})}
			</>
		);
	};

	const renderExpandableCaption = (feedItemKey, caption, captionStyle) => {
		if (!caption) {
			return null;
		}

		const CAPTION_COLLAPSED_LINES = 3;
		const isExpanded = isCaptionExpanded(feedItemKey);
		const hasOverflow = (captionOverflowMap[feedItemKey] ?? 0) > CAPTION_COLLAPSED_LINES;
		const shouldShowToggle = hasOverflow;

		return (
			<View style={styles.captionBlock}>
				<View style={styles.captionMeasureWrap} pointerEvents="none">
					<Text style={[captionStyle, styles.captionMeasureText]} onTextLayout={(event) => markCaptionOverflow(feedItemKey, event.nativeEvent.lines?.length ?? 0)}>
						{caption}
					</Text>
				</View>
				<Text style={captionStyle} numberOfLines={isExpanded ? undefined : CAPTION_COLLAPSED_LINES}>
					{renderCaptionWithMentions(caption, captionStyle)}
				</Text>
				{shouldShowToggle ? (
					<Pressable
						onPress={() => setExpandedCaptions((currentMap) => ({
							...currentMap,
							[feedItemKey]: !isExpanded,
						}))}
						style={styles.readMoreButton}
					>
						<Text style={styles.readMoreText}>{isExpanded ? 'Show less' : 'Read more'}</Text>
					</Pressable>
				) : null}
			</View>
		);
	};

	const renderPostImageUri = (image) => {
		const raw = image?.image_url ?? image?.image_path ?? '';

		if (!raw) {
			return '';
		}

		// If it's already an absolute URL, return as-is.
		if (/^https?:\/\//i.test(raw)) {
			// Replace localhost/127.0.0.1 host with configured API origin when applicable.
			if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/i.test(raw)) {
				const apiBase = String(api.defaults?.baseURL ?? '').replace(/\/?api\/?$/i, '').replace(/\/$/, '');
				if (apiBase) {
					try {
						const urlPath = raw.replace(/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/i, '');
						return `${apiBase}${urlPath}`;
					} catch (e) {
						return raw;
					}
				}
			}

			return raw;
		}

		// It's a relative path: prepend the API origin (remove trailing /api if present).
		const origin = String(api.defaults?.baseURL ?? '').replace(/\/?api\/?$/i, '').replace(/\/$/, '');

		if (!origin) {
			return raw;
		}

		return `${origin}/${String(raw).replace(/^\/+/, '')}`;
	};

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
				resizeMode="cover"
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

	const openImageViewer = (post, postImages, imageIndex) => {
		setViewerPost(post);
		setViewerImages(postImages.map((image) => ({ uri: renderPostImageUri(image) })));
		setViewerIndex(imageIndex);
		setViewerVisible(true);
	};

	const closeImageViewer = () => {
		setViewerVisible(false);
		setViewerPost(null);
	};

	const handlePostComment = useCallback((post) => {
		setActiveCommentPost(post);
		setReplyingToComment(null);
		setCommentDraft('');
		setComments([]);
		setCommentsError('');
		setExpandedCommentParents({});
		setCommentsVisible(true);
	}, []);

	const handleReplyToComment = useCallback((comment) => {
		setReplyingToComment(comment);
	}, []);

	const closeCommentsModal = () => {
		setCommentsVisible(false);
		setActiveCommentPost(null);
		setReplyingToComment(null);
		setCommentDraft('');
		setCommentInputHeight(46);
		setExpandedCommentParents({});
	};

	const handleCommentInputContentSizeChange = (event) => {
		const nextHeight = event?.nativeEvent?.contentSize?.height ?? 46;
		setCommentInputHeight(Math.max(46, Math.min(nextHeight, 84)));
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
			parent_id: replyingToComment?.id ?? null,
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
		setReplyingToComment(null);
		setCommentDraft('');
		setCommentInputHeight(46);

		api.post(`/posts/${activeCommentPost.id}/comments`, {
			comment: trimmedComment,
			parent_id: pendingComment.parent_id,
		})
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

	const toggleCommentReplies = (commentId) => {
		setExpandedCommentParents((currentState) => ({
			...currentState,
			[commentId]: !currentState[commentId],
		}));
	};

	const commentTree = useMemo(() => {
		const repliesByParentId = new Map();
		const topLevelComments = [];

		comments.forEach((comment) => {
			if (comment?.parent_id) {
				const parentReplies = repliesByParentId.get(comment.parent_id) ?? [];
				parentReplies.push(comment);
				repliesByParentId.set(comment.parent_id, parentReplies);
				return;
			}

			topLevelComments.push(comment);
		});

		const buildChildren = (parentComment) => (repliesByParentId.get(parentComment.id) ?? []).map((childComment) => ({
			comment: childComment,
			replies: buildChildren(childComment),
		}));

		return topLevelComments.map((comment) => ({
			comment,
			replies: buildChildren(comment),
		}));
	}, [comments]);

	const renderCommentNode = (thread, depth = 0, parentComment = null) => {
		const { comment, replies } = thread;
		const hasReplies = replies.length > 0;
		const isExpanded = Boolean(expandedCommentParents[comment.id]);
		const likeCount = comment?.like_count ?? comment?.reaction_count ?? comment?.likes_count ?? null;
		const isReply = depth > 0;
		const canToggleReplies = depth === 0;
		const repliesListStyle = canToggleReplies ? styles.commentRepliesList : styles.commentNestedRepliesList;

		return (
			<View key={comment.id} style={styles.commentThread}>
				<View style={[styles.commentItem, isReply ? styles.commentItemReply : null]}>
					<Image source={{ uri: renderCommentAvatarUri(comment) }} style={styles.commentAvatar} />
					<View style={styles.commentContentColumn}>
						<View style={styles.commentReplyHeaderRow}>
							<Text style={styles.commentAuthorName}>
								{isReply ? (comment?.alumni?.first_name ?? 'Alumni') : renderCommentAuthorName(comment)}
							</Text>
							{isReply && parentComment ? (
								<Text style={styles.commentReplyingToHandle} numberOfLines={1}>
										▸ {parentComment?.alumni?.first_name ?? 'Alumni'}
								</Text>
							) : null}
						</View>
						<Text style={styles.commentText}>{comment.comment ?? comment.body ?? comment.text ?? ''}</Text>
						<View style={styles.commentMetaRow}>
							<Text style={styles.commentTimestamp}>{getRelativeTimeLabel(comment.created_at)}</Text>
							<Pressable style={styles.commentReplyButton} onPress={() => handleReplyToComment(comment)}>
								<Text style={styles.commentReplyButtonText}>Reply</Text>
							</Pressable>
						</View>
					</View>
					{likeCount !== null ? (
						<View style={styles.commentActionColumn}>
							<Ionicons name="heart-outline" size={16} color="#9AA3B2" />
							<Text style={styles.commentLikeCount}>{likeCount}</Text>
						</View>
					) : null}
				</View>

				{canToggleReplies && hasReplies && !isExpanded ? (
					<Pressable style={styles.viewRepliesRow} onPress={() => toggleCommentReplies(comment.id)}>
						<View style={styles.viewRepliesLine} />
						<Text style={styles.viewRepliesText}>View {replies.length} replies</Text>
						<Ionicons name="chevron-down" size={13} color="#94A3B8" />
					</Pressable>
				) : null}

				{hasReplies && (canToggleReplies ? isExpanded : true) ? (
					<View style={repliesListStyle}>
						{replies.map((reply) => renderCommentNode(reply, depth + 1, comment))}

						{canToggleReplies ? (
							<Pressable style={styles.hideRepliesRow} onPress={() => toggleCommentReplies(comment.id)}>
								<View style={styles.viewRepliesLine} />
								<Text style={styles.hideRepliesText}>Hide replies</Text>
								<Ionicons name="chevron-up" size={13} color="#31429B" />
							</Pressable>
						) : null}
					</View>
				) : null}
			</View>
		);
	};

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

	const handleRepostMentionPick = (mentionHandle) => {
		if (!repostMentionContext) {
			return;
		}

		setRepostCaptionDraft((currentText) => {
			const safeText = String(currentText ?? '');
			const prefix = safeText.slice(0, repostMentionContext.mentionStart);
			const suffix = safeText.slice(repostMentionContext.mentionEnd);
			return `${prefix}@${mentionHandle} ${suffix}`;
		});
	};

	const handleCommentMentionPick = (mentionHandle) => {
		if (!commentMentionContext) {
			return;
		}

		setCommentDraft((currentText) => {
			const safeText = String(currentText ?? '');
			const prefix = safeText.slice(0, commentMentionContext.mentionStart);
			const suffix = safeText.slice(commentMentionContext.mentionEnd);
			return `${prefix}@${mentionHandle} ${suffix}`;
		});
	};

	const renderPressableImage = (post, postImages, image, imageIndex, imageStyle) => (
		<Pressable style={styles.postImagePressable} onPress={() => openImageViewer(post, postImages, imageIndex)}>
			{renderPostImage(post?.id ?? imageIndex, image, imageIndex, imageStyle)}
		</Pressable>
	);

	const renderPostImageLayout = (post, postId, postImages) => {
		if (postImages.length === 1) {
			const imageKey = getPostImageKey(postId, postImages[0], 0);
			const singleRatio = postImageRatios[imageKey] ?? 1.2;

			return (
				<View style={[styles.postSingleImageWrap, { aspectRatio: singleRatio }]}>
					{renderPressableImage(post, postImages, postImages[0], 0, styles.postSingleImage)}
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
						{renderPressableImage(post, postImages, postImages[0], 0, styles.postCollageImage)}
					</View>
					<View
						style={[
							styles.postTwoSecondaryTile,
							{ aspectRatio: postImageRatios[getPostImageKey(postId, postImages[1], 1)] ?? 0.95 },
						]}
					>
						{renderPressableImage(post, postImages, postImages[1], 1, styles.postCollageImage)}
					</View>
				</View>
			);
		}

		if (postImages.length === 3) {
			return (
				<View style={styles.postThreeCollage}>
					<View style={styles.postThreeLeftTile}>
						{renderPressableImage(post, postImages, postImages[0], 0, styles.postCollageImage)}
					</View>
					<View style={styles.postThreeRightColumn}>
						<View style={styles.postThreeRightTile}>
							{renderPressableImage(post, postImages, postImages[1], 1, styles.postCollageImage)}
						</View>
						<View style={styles.postThreeRightTile}>
							{renderPressableImage(post, postImages, postImages[2], 2, styles.postCollageImage)}
						</View>
					</View>
				</View>
			);
		}

		if (postImages.length === 4) {
			return (
				<View style={styles.postFourGrid}>
					{postImages.slice(0, 4).map((image, imageIndex) => {
						const tileKey = getPostImageKey(postId, image, imageIndex);

						return (
							<View key={tileKey} style={styles.postFourGridTile}>
								{renderPressableImage(post, postImages, image, imageIndex, styles.postCollageImage)}
							</View>
						);
					})}
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
							{renderPressableImage(post, postImages, image, imageIndex, styles.postCollageImage)}
							{isLastVisibleTile ? renderOverlayCount(remainingCount, () => openImageViewer(post, postImages, imageIndex)) : null}
						</View>
					);
				})}
			</View>
		);
	};

	const handleRefreshPosts = () => {
		fetchPosts({ showLoadingState: true });
	};

	const activePostActionVisibilityLabel = getPostVisibilityLabel(activePostActionPost);

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
								const postAuthorName = renderPostAuthorName(post);
								const avatarUri = renderPostAvatarUri(post);
								const postImages = post.images ?? [];
								const isRepostFeedItem = post.feed_type === 'repost';
								const isAnnouncementFeedItem = post.feed_type === 'announcement';
								const originalPost = post.original_post ?? null;
								const originalAuthorName = renderPostAuthorName({ alumni: originalPost?.alumni });
								const originalAvatarUri = renderPostAvatarUri({ alumni: originalPost?.alumni });

								return (
									<View key={getFeedItemKey(post)} style={styles.postCard}>
										{isAnnouncementFeedItem ? (
											<View style={styles.postHeader}>
												<Image
													source={require('../../assets/images/nu-lipa-logo-portrait-white-version-21.png')}
													style={styles.announcementAvatar}
													resizeMode="contain"
												/>
												<View style={styles.postHeaderTextWrap}>
													<Text style={styles.postAuthorName}>NU LIPA ALUMNI AFFAIRS</Text>
													<View style={styles.postMetaRow}>
														<Text style={styles.postMeta}>{getRelativeTimeLabel(post.created_at)}</Text>
														<Text style={styles.postMetaSeparator}>•</Text>
														<Text style={styles.postMeta}>Admin</Text>
													</View>
												</View>
											</View>
										) : (
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
														<Text style={styles.postAuthorName} numberOfLines={1} ellipsizeMode="tail">
															{postAuthorName}
														</Text>
													</Pressable>
													<View style={styles.postMetaRow}>
														<Text style={styles.postMeta}>{getRelativeTimeLabel(post.created_at)}</Text>
														<Text style={styles.postMetaSeparator}>•</Text>
														<Ionicons name="earth-outline" size={10} color="#7A7A7A" />
														<Text style={styles.postMeta}>{getPostVisibilityLabel(post)}</Text>
														{isRepostFeedItem ? (
															<>
																<Text style={styles.postMetaSeparator}>•</Text>
																<Text style={styles.postMeta}>Reposted</Text>
															</>
														) : null}
													</View>
												</View>
													<View style={styles.postHeaderRight}>
														<Pressable style={styles.postMenuButton} onPress={() => openPostActions(post)} hitSlop={8}>
															<Ionicons name="ellipsis-horizontal" size={16} color="#31429B" />
														</Pressable>
													</View>
											</View>
										)}

										{isAnnouncementFeedItem ? (
											<>
												{post.announcement_title ? <Text style={styles.announcementTitle}>{post.announcement_title}</Text> : null}
												{renderExpandableCaption(getFeedItemKey(post), post.announcement_description, styles.postCaption)}
											</>
										) : renderExpandableCaption(getFeedItemKey(post), post.caption, styles.postCaption)}

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
															<Text style={styles.postMeta}>{getPostVisibilityLabel(originalPost)}</Text>
														</View>
													</View>
												</View>

												{originalPost.caption ? (
													<Text style={styles.repostedOriginalCaption}>{originalPost.caption}</Text>
												) : null}
											</View>
										) : null}

										{postImages.length > 0 ? renderPostImageLayout(post, post.id, postImages) : null}

										<View style={styles.postReactionRow}>
											<Pressable
												style={[
													styles.postReactionButton,
													post.my_reaction ? styles.postReactionButtonActive : null,
												]}
												onPress={isAnnouncementFeedItem ? () => {
													showThemedAlert({
														title: 'NU LIPA ALUMNI OFFICE',
														message: 'Reaction actions for announcements are not available yet.',
													});
												} : () => handlePostReaction(post)}
											>
												<Animated.View
													style={[
														styles.postActionInline,
														reactionPulsePostId === post.id ? { transform: [{ scale: reactionPulseScale }] } : null,
													]}
												>
													<Ionicons
														name={post.my_reaction ? 'heart' : 'heart-outline'}
														size={16}
														color={post.my_reaction ? '#EF4444' : '#31429B'}
													/>
													<Text style={styles.postActionCount}>{post.reaction_count ?? 0}</Text>
												</Animated.View>
											</Pressable>

											<Pressable
												style={styles.postCommentButton}
												onPress={isAnnouncementFeedItem ? () => {
													showThemedAlert({
														title: 'NU LIPA ALUMNI OFFICE',
														message: 'Commenting on announcements is not available yet.',
													});
												} : () => handlePostComment(post)}
											>
												<View style={styles.postActionInline}>
													<Ionicons name="chatbubble-outline" size={16} color="#56607A" />
													<Text style={styles.postActionCount}>{post.comment_count ?? 0}</Text>
												</View>
											</Pressable>

											<Pressable
												style={[styles.postRepostButton, post.my_repost ? styles.postRepostButtonActive : null]}
												onPress={isAnnouncementFeedItem ? () => {
													showThemedAlert({
														title: 'NU LIPA ALUMNI OFFICE',
														message: 'Reposting announcements is not available yet.',
													});
												} : () => openRepostComposer(post)}
											>
												<View style={styles.postActionInline}>
													<Ionicons name="share-social-outline" size={16} color={post.my_repost ? '#15803D' : '#2F855A'} />
													<Text style={styles.postActionCount}>{post.repost_count ?? 0}</Text>
												</View>
											</Pressable>
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
					post={viewerPost}
					viewerAuthorName={viewerPost ? renderPostAuthorName(viewerPost) : ''}
					postAvatarUri={viewerPost ? renderPostAvatarUri(viewerPost) : ''}
					timeLabel={viewerPost ? getRelativeTimeLabel(viewerPost.created_at) : ''}
					postVisibilityLabel={viewerPost ? getPostVisibilityLabel(viewerPost) : 'Public'}
					reactionCount={viewerPost?.reaction_count ?? 0}
					commentCount={viewerPost?.comment_count ?? 0}
					repostCount={viewerPost?.repost_count ?? 0}
					isReacted={Boolean(viewerPost?.my_reaction)}
					onRequestClose={closeImageViewer}
					onAuthorPress={() => {
						if (!viewerPost?.alumni?.id) {
							return;
						}

						if (viewerPost.alumni.id === userData?.id) {
							navigation.navigate('Profile');
						} else {
							navigation.navigate('ProfileView', { userId: viewerPost.alumni.id });
						}
					}}
					onReactionPress={() => (viewerPost ? handlePostReaction(viewerPost) : null)}
					onCommentPress={() => (viewerPost ? handlePostComment(viewerPost) : null)}
					onRepostPress={() => (viewerPost ? openRepostComposer(viewerPost) : null)}
					onMenuPress={() => {
						if (canManagePost(viewerPost)) {
							openPostActions(viewerPost);
							return;
						}

						showThemedAlert({
							title: 'Image options',
							message: 'More image actions are not available yet.',
							actions: [{ text: 'OK' }],
						});
					}}
				/>

				<Modal transparent visible={postActionsVisible} animationType="slide" statusBarTranslucent={true} onRequestClose={closePostActions}>
					<View style={styles.postActionsBackdrop}>
						<Animated.View style={[styles.postActionsCard, { transform: [{ translateY: postActionsTranslateY }] }]} onTouchMove={handlePostActionsSwipe} onTouchEnd={() => { resetSwipeRefs(); }}>
							<View style={{ height: 4, width: 40, backgroundColor: '#D1D5DB', borderRadius: 2, alignSelf: 'center', marginTop: 8, marginBottom: 4 }} />
							<View style={styles.postActionsHeader}>
								<Text style={styles.postActionsTitle}>Manage Post</Text>
								<Pressable style={styles.postActionsCloseButton} onPress={closePostActions} hitSlop={8} disabled={isPostActionSaving}>
									<Ionicons name="close" size={20} color="#31429B" />
								</Pressable>
							</View>

							{canManagePost(activePostActionPost) ? (
								<>
									<Text style={styles.postActionsSubtitle}>
										{activePostActionVisibilityLabel}. Edit the post, save it as a draft, change who can view it, or delete it.
									</Text>

									<View style={styles.postActionsRow}>
										<Pressable style={styles.postActionChoiceButton} onPress={handleEditActivePost} disabled={isPostActionSaving}>
											<Ionicons name="create-outline" size={16} color="#31429B" />
											<Text style={styles.postActionChoiceText}>Edit</Text>
										</Pressable>

										<Pressable style={styles.postActionChoiceButton} onPress={handleToggleActivePostDraft} disabled={isPostActionSaving}>
											<Ionicons name={activePostActionPost?.is_draft ? 'cloud-upload-outline' : 'bookmark-outline'} size={16} color="#31429B" />
											<Text style={styles.postActionChoiceText}>{activePostActionPost?.is_draft ? 'Publish' : 'Draft'}</Text>
										</Pressable>
									</View>

									<Text style={styles.postActionsLabel}>Who can view this post?</Text>
									<View style={styles.postVisibilityChoicesRow}>
										{['public', 'friends', 'private'].map((visibility) => {
											const isSelected = (activePostActionPost?.visibility ?? 'public') === visibility;

											return (
												<Pressable
													key={visibility}
													style={[styles.postVisibilityChoice, isSelected && styles.postVisibilityChoiceSelected]}
													onPress={() => handleChangeActivePostVisibility(visibility)}
													disabled={isPostActionSaving}
												>
													<Text style={styles.postVisibilityChoiceText}>{getPostVisibilityLabel({ visibility })}</Text>
												</Pressable>
											);
										})}
									</View>

									<Pressable style={styles.postDeleteButton} onPress={handleDeleteActivePost} disabled={isPostActionSaving}>
										<Ionicons name="trash-outline" size={16} color="#B42318" />
										<Text style={styles.postDeleteButtonText}>Delete Post</Text>
									</Pressable>
								</>
							) : (
								<>
									<Text style={styles.postActionsSubtitle}>Actions for this post</Text>
									<View style={styles.postActionsRow}>
										<Pressable style={styles.postActionChoiceButton} onPress={handleReportPost}>
											<Ionicons name="flag-outline" size={16} color="#31429B" />
											<Text style={styles.postActionChoiceText}>Report</Text>
										</Pressable>

										<Pressable style={styles.postActionChoiceButton} onPress={handleMuteAuthor}>
											<Ionicons name="volume-mute-outline" size={16} color="#31429B" />
											<Text style={styles.postActionChoiceText}>Mute user</Text>
										</Pressable>
									</View>

									<View style={styles.postActionsRow}>
										<Pressable style={styles.postActionChoiceButton} onPress={handleHidePost}>
											<Ionicons name="eye-off-outline" size={16} color="#31429B" />
											<Text style={styles.postActionChoiceText}>Hide post</Text>
										</Pressable>

										<Pressable style={styles.postActionChoiceButton} onPress={handleCopyLink}>
											<Ionicons name="link-outline" size={16} color="#31429B" />
											<Text style={styles.postActionChoiceText}>Copy link</Text>
										</Pressable>
									</View>
								</>
							)}
						</Animated.View>
					</View>
				</Modal>

				<Modal visible={isDeletingPost} transparent animationType="fade" statusBarTranslucent>
					<View style={styles.deleteLoadingBackdrop}>
						<View style={styles.deleteLoadingCard}>
							<ActivityIndicator size="large" color="#31429B" />
							<Text style={styles.deleteLoadingTitle}>Deleting post</Text>
							<Text style={styles.deleteLoadingText}>Please wait while the post is removed.</Text>
						</View>
					</View>
				</Modal>

				<Modal
					transparent
					visible={repostComposerVisible}
					animationType="slide"
					onRequestClose={closeRepostComposer}
				>
					<View style={styles.repostModalBackdrop}>
						<Pressable style={StyleSheet.absoluteFillObject} onPress={closeRepostComposer} />

						<Animated.View style={[styles.repostModalCard, { transform: [{ translateY: repostComposerTranslateY }] }]} onTouchMove={handleRepostComposerSwipe} onTouchEnd={() => { resetSwipeRefs(); }}>
							<View style={{ height: 4, width: 40, backgroundColor: '#D1D5DB', borderRadius: 2, alignSelf: 'center', marginTop: 8, marginBottom: 8 }} />
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

							{repostMentionContext && repostMentionSuggestions.length > 0 ? (
								<View style={styles.mentionPanel}>
									{repostMentionSuggestions.map((item) => (
										<Pressable
											key={`repost-mention-${String(item.id ?? item.name)}`}
											style={styles.mentionItem}
											onPress={() => handleRepostMentionPick(item.handle)}
										>
											<Image source={{ uri: item.avatar }} style={styles.mentionAvatar} />
											<Text style={styles.mentionName} numberOfLines={1}>@{item.handle}</Text>
										</Pressable>
									))}
								</View>
							) : null}

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
						</Animated.View>
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

						<SafeAreaView style={styles.commentsSheet} edges={['top', 'bottom']}>
							<Animated.View style={{ flex: 1, transform: [{ translateY: commentsTranslateY }] }} onTouchMove={handleCommentsSwipe} onTouchEnd={() => { resetSwipeRefs(); }}>
								<View style={{ height: 4, width: 40, backgroundColor: '#D1D5DB', borderRadius: 2, alignSelf: 'center', marginTop: 6, marginBottom: 4 }} />
							<View style={styles.commentsHeaderRow}>
								<View style={styles.commentsHeaderCenter}>
									<Text style={styles.commentsTitle}>
										{activeCommentPost?.comment_count ?? comments.length} comments
									</Text>
									<Pressable style={styles.commentsHeaderFilter}>
										<Ionicons name="options-outline" size={16} color="#111827" />
									</Pressable>
								</View>

								<Pressable style={styles.commentsCloseButton} onPress={closeCommentsModal}>
									<Ionicons name="close" size={20} color="#111827" />
								</Pressable>
							</View>

							<CustomKeyboardView style={styles.commentsBody} keyboardVerticalOffset={90} footer={(
								<View style={styles.commentComposerSafeArea}>
									<View style={styles.commentComposer}>
										<View style={styles.commentComposerContent}>
											{replyingToComment ? (
												<View style={styles.commentReplyContext}>
													<Text style={styles.commentReplyContextText} numberOfLines={1}>
														Replying to {renderCommentAuthorName(replyingToComment)}
													</Text>
													<Pressable style={styles.commentReplyContextCancel} onPress={() => setReplyingToComment(null)}>
														<Ionicons name="close" size={14} color="#31429B" />
													</Pressable>
												</View>
											) : null}

											<View style={styles.commentInputWrap}>
												<TextInput
													value={commentDraft}
													onChangeText={setCommentDraft}
													onContentSizeChange={handleCommentInputContentSizeChange}
													placeholder={replyingToComment ? 'Write a reply...' : 'Write a comment...'}
													placeholderTextColor="#8A94A6"
													style={[styles.commentInput, { height: commentInputHeight }]}
													multiline
													scrollEnabled={false}
													textAlignVertical="top"
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

											{commentMentionContext && commentMentionSuggestions.length > 0 ? (
												<View style={styles.commentMentionPanel}>
													{commentMentionSuggestions.map((item) => (
														<Pressable
															key={`comment-mention-${String(item.id ?? item.name)}`}
															style={styles.mentionItem}
															onPress={() => handleCommentMentionPick(item.handle)}
														>
															<Image source={{ uri: item.avatar }} style={styles.mentionAvatar} />
															<Text style={styles.mentionName} numberOfLines={1}>@{item.handle}</Text>
														</Pressable>
													))}
												</View>
											) : null}
										</View>
									</View>
								</View>
							)}>
								<ScrollView
									style={styles.commentsList}
									contentContainerStyle={styles.commentsListContent}
									showsVerticalScrollIndicator={false}
									nestedScrollEnabled
								>
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
										commentTree.map((thread) => renderCommentNode(thread))
									)}
								</ScrollView>
							</CustomKeyboardView>
							</Animated.View>
						</SafeAreaView>
					</View>
				</Modal>
			</View>
		</SafeAreaView>
	);
};

export default UserFeedScreen;
