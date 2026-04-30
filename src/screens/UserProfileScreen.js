import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, Image, TouchableOpacity, ActivityIndicator, ScrollView, useWindowDimensions, Modal, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';
import BrandHeader from '../components/BrandHeader';
import styles from '../styles/UserProfileScreen.styles';
import { getAuthToken } from '../services/authStorage';
import { showBrandedAlert } from '../services/brandedAlert';

const UserProfileScreen = ({ navigation }) => {
	// SECTION: Layout values
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
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [isBioModalVisible, setIsBioModalVisible] = useState(false);
  const [bioDraft, setBioDraft] = useState('');
  const [postActionPost, setPostActionPost] = useState(null);
  const [isPostActionModalVisible, setIsPostActionModalVisible] = useState(false);
  const [isPostActionSaving, setIsPostActionSaving] = useState(false);
  const [isWorkModalVisible, setIsWorkModalVisible] = useState(false);
  const [workDraft, setWorkDraft] = useState({
    id: null,
    title: '',
    subtitle: '',
    startYear: null,
    endYear: null,
    location: '',
    description: '',
  });
  const [isWorkSaving, setIsWorkSaving] = useState(false);
  const [yearDropdownType, setYearDropdownType] = useState(null); // 'start' or 'end'

	// DERIVED VALUE: Profile display name
  const profileName = useMemo(() => {
    if (!userData) {
      return 'Dela Cruz, Juan Miguel';
    }

    return [userData.last_name, userData.first_name]
      .filter(Boolean)
      .join(', ')
      .replace(/, ([^,]+)$/, ', $1');
  }, [userData]);

	// DERIVED VALUE: Profile image URI
  const profileImageUri = useMemo(() => {
    if (userData?.alumni_photo) {
      return userData.alumni_photo;
    }

    return `https://ui-avatars.com/api/?name=${encodeURIComponent(profileName)}&background=1F2F6E&color=fff&size=256`;
  }, [profileName, userData]);

  const openConnectionsScreen = () => {
    navigation.navigate('ConnectionsScreen');
  };

	// DERIVED VALUE: Profile summary values
  const profileSummary = useMemo(() => ({
    headlineText: userData?.headline || 'Software Engineer at Microsoft',
    locationText: userData?.location || 'Lipa City, Batangas',
    classTag: userData?.year_graduated
      ? `Class of ${String(userData.year_graduated).match(/\d{4}/)?.[0] ?? String(userData.year_graduated).slice(0, 4)}`
      : 'Class of',
    sectionTag: userData?.program || 'BSIT',
    connectionsCount: userData?.connections_count ?? 0,
    postsCount: userData?.posts_count ?? 0,
    biographyText:
      userData?.alumni_bio ||
      'No biography added yet. Tap the edit button to add a biography and let people know more about you!',
  }), [userData]);

	// DERIVED VALUE: Work experience card data
  const workExperience = useMemo(() => {
    if (Array.isArray(userData?.work_experiences) && userData.work_experiences.length > 0) {
      return userData.work_experiences[0];
    }

    return {
      title: 'Student Developer',
      subtitle: 'NU Lipa - LumiNUs Portal',
      period: '2021 - 2022',
      location: 'Lipa City, Batangas',
      description: "Contributed to the development of the university's alumni portal.",
    };
  }, [userData]);

  const openWorkModal = (employment = null) => {
    const source = employment ?? null;

    setWorkDraft({
      id: source?.id ?? null,
      title: source?.title ?? '',
      subtitle: source?.subtitle ?? '',
      startYear: source?.startYear ?? null,
      endYear: source?.endYear ?? null,
      location: source?.location ?? '',
      description: source?.description ?? '',
    });

    setIsWorkModalVisible(true);
  };

  const closeWorkModal = () => {
    if (isWorkSaving) return;
    setIsWorkModalVisible(false);
  };

  const saveWorkExperience = async () => {
    // Validate required fields
    if (!workDraft.title.trim()) {
      showBrandedAlert('Missing field', 'Please enter a position/title.', [{ text: 'OK' }], { variant: 'error' });
      return;
    }
    if (!workDraft.subtitle.trim()) {
      showBrandedAlert('Missing field', 'Please enter a company/organization.', [{ text: 'OK' }], { variant: 'error' });
      return;
    }
    if (!workDraft.location.trim()) {
      showBrandedAlert('Missing field', 'Please enter a location.', [{ text: 'OK' }], { variant: 'error' });
      return;
    }

    const payload = {
      title: workDraft.title.trim(),
      subtitle: workDraft.subtitle.trim(),
      location: workDraft.location.trim(),
    };

    // Only add optional fields if they have values
    if (workDraft.startYear) {
      payload.start_date = `${workDraft.startYear}-01-01`;
    }
    if (workDraft.endYear) {
      payload.end_date = `${workDraft.endYear}-12-31`;
    }
    if (workDraft.description.trim()) {
      payload.description = workDraft.description.trim();
    }

    try {
      setIsWorkSaving(true);

      const token = await getAuthToken();
      if (!token) {
        showBrandedAlert('Sign in required', 'Please sign in again before updating work experience.', [{ text: 'OK' }], { variant: 'error' });
        return;
      }

      if (workDraft.id) {
        await api.patch(`/alumni/employments/${workDraft.id}`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } else {
        await api.post('/alumni/employments', payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }

      await loadProfile();
      setIsWorkModalVisible(false);
      showBrandedAlert('Work experience saved', 'Your work experience was updated.', [{ text: 'OK' }], { variant: 'success' });
    } catch (err) {
      console.error('Failed to save work experience:', err);
      
      // Extract validation errors from backend
      let errorMsg = 'Unable to save work experience right now.';
      if (err.response?.data?.errors) {
        const errors = err.response.data.errors;
        const firstError = Object.values(errors)[0];
        errorMsg = Array.isArray(firstError) ? firstError[0] : firstError;
      } else if (err.response?.data?.message) {
        errorMsg = err.response.data.message;
      }
      
      showBrandedAlert('Save failed', errorMsg, [{ text: 'OK' }], { variant: 'error' });
    } finally {
      setIsWorkSaving(false);
    }
  };

  const handleDeleteWork = (employment) => {
    if (!employment?.id) return;

    showBrandedAlert(
      'Delete work experience?',
      'This action cannot be undone.',
      [
        { text: 'Cancel' },
        {
          text: 'Delete',
          onPress: async () => {
            try {
              setIsWorkSaving(true);

              const token = await getAuthToken();
              if (!token) {
                showBrandedAlert('Sign in required', 'Please sign in again before deleting work experience.', [{ text: 'OK' }], { variant: 'error' });
                return;
              }

              await api.delete(`/alumni/employments/${employment.id}`, {
                headers: { Authorization: `Bearer ${token}` },
              });

              await loadProfile();
              showBrandedAlert('Deleted', 'Work experience removed.', [{ text: 'OK' }], { variant: 'success' });
            } catch (err) {
              console.error('Failed to delete work experience:', err);
              showBrandedAlert('Delete failed', 'Unable to delete work experience right now.', [{ text: 'OK' }], { variant: 'error' });
            } finally {
              setIsWorkSaving(false);
            }
          },
        },
      ],
      { variant: 'error' }
    );
  };

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

  const visibilityLabels = {
    public: 'Public',
    private: 'Private',
    friends: 'Friends',
  };

  const loadProfile = async () => {
    try {
      setLoading(true);
      setErrorMessage('');

      const token = await getAuthToken();

      if (!token) {
        setErrorMessage('No active session found.');
        return;
      }

      const response = await api.get('/alumni/profile', {
        headers: { Authorization: `Bearer ${token}` },
      });

      const postsResponse = await api.get('/alumni/profile/posts', {
        headers: { Authorization: `Bearer ${token}` },
      });

      setUserData(response.data?.alumni ?? null);
      setProfilePosts(postsResponse.data?.posts ?? []);
    } catch (fetchError) {
      console.error('Failed to fetch profile:', fetchError);
      setErrorMessage('Unable to load profile right now.');
    } finally {
      setLoading(false);
    }
  };

  const renderProfilePostImages = (postImages = []) => {
    if (!Array.isArray(postImages) || postImages.length === 0) {
      return null;
    }

    const visibleImages = postImages.slice(0, 4);
    const remainingCount = Math.max(postImages.length - 4, 0);
    const isSingleImage = visibleImages.length === 1;

    if (isSingleImage) {
      const image = visibleImages[0];
      const imageKey = image?.id ?? getPostImageUri(image);

      return (
        <View style={styles.profilePostImagesGrid}>
          <View key={imageKey} style={[styles.profilePostImageTile, styles.profilePostImageTileSingle]}>
            <Image
              source={{ uri: getPostImageUri(image) }}
              style={styles.profilePostImage}
              resizeMode="cover"
            />
          </View>
        </View>
      );
    }

    const rows = [];

    for (let index = 0; index < visibleImages.length; index += 2) {
      rows.push(visibleImages.slice(index, index + 2));
    }

    return (
      <View style={styles.profilePostImagesGrid}>
        {rows.map((row, rowIndex) => (
          <View key={`row-${rowIndex}`} style={styles.profilePostImagesRow}>
            {row.map((image, columnIndex) => {
              const absoluteIndex = (rowIndex * 2) + columnIndex;
              const imageKey = image?.id ?? `${absoluteIndex}-${getPostImageUri(image)}`;
              const showOverlay = absoluteIndex === 3 && remainingCount > 0;

              return (
                <View
                  key={imageKey}
                  style={[
                    styles.profilePostImageTile,
                    columnIndex === 0 ? styles.profilePostImageTileWithGap : null,
                  ]}
                >
                  <Image
                    source={{ uri: getPostImageUri(image) }}
                    style={styles.profilePostImage}
                    resizeMode="cover"
                  />

                  {showOverlay ? (
                    <View style={styles.profilePostImageOverlay}>
                      <Text style={styles.profilePostImageOverlayText}>+{remainingCount}</Text>
                    </View>
                  ) : null}
                </View>
              );
            })}

            {row.length === 1 ? <View style={styles.profilePostImageTileSpacer} /> : null}
          </View>
        ))}
      </View>
    );
  };

	// SECTION: Load profile data
  useEffect(() => {
    loadProfile();
  }, []);

	// HANDLER: Open biography editor
  const openBioModal = () => {
    setBioDraft(userData?.bio ?? '');
    setIsBioModalVisible(true);
  };

	// HANDLER: Close biography editor
  const closeBioModal = () => {
    setIsBioModalVisible(false);
  };

	// HANDLER: Save biography changes
  const saveBiography = async () => {
    const nextBio = bioDraft.trim();
    const previousBio = userData?.alumni_bio ?? '';

    setUserData((currentUserData) => ({
      ...(currentUserData ?? {}),
      alumni_bio: nextBio || null,
    }));
    setIsBioModalVisible(false);

    try {
      const token = await getAuthToken();

      if (!token) {
        setErrorMessage('No active session found.');
        return;
      }

      const response = await api.put('/alumni/profile', {
        alumni_bio: nextBio || null,
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setUserData(response.data?.alumni ?? null);
    } catch (saveError) {
      console.error('Failed to save biography:', saveError);
      setErrorMessage('Unable to save biography right now.');
      setUserData((currentUserData) => ({
        ...(currentUserData ?? {}),
        alumni_bio: previousBio || null,
      }));
    } finally {
    }
  };

  const openPostActions = (post) => {
    setPostActionPost(post);
    setIsPostActionModalVisible(true);
  };

  const closePostActions = () => {
    if (isPostActionSaving) {
      return;
    }

    setIsPostActionModalVisible(false);
    setPostActionPost(null);
  };

  const savePostUpdate = async (payload, successTitle, successMessage) => {
    if (!postActionPost?.id || isPostActionSaving) {
      return;
    }

    try {
      setIsPostActionSaving(true);

      const token = await getAuthToken();

      if (!token) {
        showBrandedAlert('Sign in required', 'Please sign in again before updating a post.', [{ text: 'OK' }], { variant: 'error' });
        return;
      }

      await api.patch(`/posts/${postActionPost.id}`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      await loadProfile();
      setIsPostActionModalVisible(false);
      setPostActionPost(null);
      showBrandedAlert(successTitle, successMessage, [{ text: 'OK' }], { variant: 'success' });
    } catch (error) {
      console.error('Failed to update post:', error);
      showBrandedAlert('Update failed', 'Unable to update the post right now.', [{ text: 'OK' }], { variant: 'error' });
    } finally {
      setIsPostActionSaving(false);
    }
  };

  const handleToggleDraft = () => {
    if (!postActionPost) {
      return;
    }

    savePostUpdate(
      { is_draft: !postActionPost.is_draft },
      postActionPost.is_draft ? 'Post published' : 'Draft saved',
      postActionPost.is_draft ? 'Your post is visible again.' : 'Your post was saved as a draft.'
    );
  };

  const handleChangeVisibility = (visibility) => {
    savePostUpdate(
      { visibility },
      'Visibility updated',
      `This post is now visible to ${visibilityLabels[visibility] ?? 'selected viewers'}.`
    );
  };

  const handleEditPost = () => {
    if (!postActionPost) {
      return;
    }

    setIsPostActionModalVisible(false);
    navigation.navigate('CreatePostScreen', { post: postActionPost });
    setPostActionPost(null);
  };

  const handleDeletePost = () => {
    if (!postActionPost) {
      return;
    }

    showBrandedAlert(
      'Delete post?',
      'This action cannot be undone.',
      [
        { text: 'Cancel' },
        {
          text: 'Delete',
          onPress: async () => {
            try {
              setIsPostActionSaving(true);

              const token = await getAuthToken();

              if (!token) {
                showBrandedAlert('Sign in required', 'Please sign in again before deleting a post.', [{ text: 'OK' }], { variant: 'error' });
                return;
              }

              await api.delete(`/posts/${postActionPost.id}`, {
                headers: { Authorization: `Bearer ${token}` },
              });

              await loadProfile();
              setIsPostActionModalVisible(false);
              setPostActionPost(null);
              showBrandedAlert('Post deleted', 'Your post has been removed.', [{ text: 'OK' }], { variant: 'success' });
            } catch (error) {
              console.error('Failed to delete post:', error);
              showBrandedAlert('Delete failed', 'Unable to delete the post right now.', [{ text: 'OK' }], { variant: 'error' });
            } finally {
              setIsPostActionSaving(false);
            }
          },
        },
      ],
      { variant: 'error' }
    );
  };

  // HANDLER: Open account settings
  const openAccountSettings = () => {
    const parentNavigator = navigation.getParent?.();

    if (parentNavigator?.navigate) {
      parentNavigator.navigate('AccountSettings');
      return;
    }

    navigation.navigate('AccountSettings');
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container}>
        <BrandHeader />

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {loading ? (
            <View style={styles.stateWrap}>
              <ActivityIndicator size="large" color="#31429B" />
            </View>
          ) : errorMessage ? (
            <View style={styles.stateWrap}>
              <Text style={styles.errorText}>{errorMessage}</Text>
              <TouchableOpacity style={styles.actionButton} activeOpacity={0.8} onPress={openAccountSettings}>
                <Text style={styles.actionButtonText}>Open Account Settings</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <View style={[styles.heroCard, { padding: layout.heroPadding }]}>
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
                      <TouchableOpacity onPress={openAccountSettings} style={styles.iconButton} activeOpacity={0.8}>
                        <Ionicons name="settings" size={18} color="#FFFFFF" />
                      </TouchableOpacity>
                    </View>

                    <View style={styles.tagPill}>
                      <Ionicons name="school" size={11} color="#31429B" />
                      <Text style={styles.tagText}>
                        {profileSummary.classTag} | {profileSummary.sectionTag}
                      </Text>
                    </View>

                    <View style={styles.statsRow}>
                      <TouchableOpacity style={styles.statBlock} activeOpacity={0.85} onPress={openConnectionsScreen}>
                        <Text style={styles.statValue}>{profileSummary.connectionsCount}</Text>
                        <Text style={styles.statLabel}>Connections</Text>
                      </TouchableOpacity>
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
              </View>

              <View style={styles.aboutSectionWrap}>
                <View style={styles.aboutSectionCard}>
                  <View style={styles.sectionHeaderRow}>
                    <Text style={styles.sectionHeading}>About Me</Text>
                    <TouchableOpacity style={styles.editPill} activeOpacity={0.8} onPress={openAccountSettings}>
                      <Ionicons name="create-outline" size={12} color="#404040" />
                      <Text style={styles.editPillText}>Edit</Text>
                    </TouchableOpacity>
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
                    <TouchableOpacity style={styles.editPill} activeOpacity={0.8} onPress={openBioModal}>
                      <Ionicons name="create-outline" size={12} color="#404040" />
                      <Text style={styles.editPillText}>Edit</Text>
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.biographyText}>{profileSummary.biographyText}</Text>
                </View>
              </View>

              <View style={styles.sectionBlock}>
                <View style={styles.workSectionCard}>
                  <View style={styles.sectionHeaderRow}>
                    <Text style={styles.sectionHeading}>Work Experience</Text>
                    <TouchableOpacity style={styles.editPill} activeOpacity={0.8} onPress={() => openWorkModal(null)}>
                      <Ionicons name="add" size={12} color="#404040" />
                      <Text style={styles.editPillText}>Add</Text>
                    </TouchableOpacity>
                  </View>

                  <View>
                    {Array.isArray(userData?.work_experiences) && userData.work_experiences.length > 0 ? (
                      userData.work_experiences.map((emp) => (
                        <View key={emp.id ?? `${emp.title}-${emp.period}`} style={styles.workCard}>
                          <View style={styles.workRow}>
                            <View style={styles.workContent}>
                              <View style={styles.workTitleRow}>
                                <Ionicons name="briefcase" size={15} color="#31429B" />
                                <Text style={styles.workTitle}>{emp.title}</Text>
                              </View>
                              {emp.subtitle ? <Text style={styles.workSubtitle}>{emp.subtitle}</Text> : null}
                              {emp.period ? <Text style={styles.workPeriod}>{emp.period}</Text> : null}
                              {emp.location ? (
                                <View style={styles.workLocationRow}>
                                  <Ionicons name="location-sharp" size={15} color="#5C6471" />
                                  <Text style={styles.workLocation}>{emp.location}</Text>
                                </View>
                              ) : null}

                              {emp.description ? <Text style={styles.workDescription}>{emp.description}</Text> : null}
                            </View>

                            <View style={styles.workActionsRow || { justifyContent: 'flex-end' }}>
                              <TouchableOpacity style={styles.editPill} activeOpacity={0.8} onPress={() => openWorkModal(emp)}>
                                <Ionicons name="create-outline" size={12} color="#404040" />
                                <Text style={styles.editPillText}>Edit</Text>
                              </TouchableOpacity>

                              <TouchableOpacity style={[styles.postDeleteButton, { marginLeft: 8 }]} activeOpacity={0.8} onPress={() => handleDeleteWork(emp)}>
                                <Ionicons name="trash-outline" size={15} color="#B91C1C" />
                                <Text style={styles.postDeleteButtonText}>Delete</Text>
                              </TouchableOpacity>
                            </View>
                          </View>
                        </View>
                      ))
                    ) : (
                      <View style={styles.workCard}>
                        <Text style={styles.emptyPostsText}>No work experience yet.</Text>
                      </View>
                    )}
                  </View>
                </View>
              </View>

              <View style={styles.postsSectionBlock}>
                <View style={styles.postsHeaderRow}>
                  <Text style={styles.sectionHeading}>Posts</Text>
                  <TouchableOpacity
                    style={styles.createPostButton}
                    activeOpacity={0.85}
                    onPress={() => navigation.navigate('CreatePostScreen')}
                  >
                    <Ionicons name="add" size={14} color="#FFFFFF" />
                    <Text style={styles.createPostButtonText}>Create</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.postsCard}>
                  {profilePosts.length === 0 ? (
                    <Text style={styles.emptyPostsText}>No posts yet.</Text>
                  ) : (
                    profilePosts.map((post) => {
                      const isRepost = post.feed_type === 'repost';
                      const originalCaption = post.original_post?.caption ?? '';
                      const postImages = post.images ?? [];
                      const visibilityLabel = visibilityLabels[post.visibility] ?? 'Public';

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

                            <View style={styles.profilePostHeaderRight}>
                              <View style={styles.profilePostStatusGroup}>
                                <Text style={styles.profilePostTime}>{new Date(post.created_at).toLocaleString()}</Text>
                                <Text style={styles.profilePostVisibilityText}>
                                  {post.is_draft ? 'Draft' : visibilityLabel}
                                </Text>
                              </View>
                              <TouchableOpacity
                                style={styles.profilePostMenuButton}
                                activeOpacity={0.85}
                                onPress={() => openPostActions(post)}
                              >
                                <Ionicons name="ellipsis-horizontal" size={16} color="#31429B" />
                              </TouchableOpacity>
                            </View>
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

        {/* Post Action Modal */}
        <Modal
          visible={isPostActionModalVisible}
          transparent
          animationType="fade"
          onRequestClose={closePostActions}
        >
          <View style={styles.postActionOverlay}>
            <View style={styles.postActionCard}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Manage Post</Text>
                <TouchableOpacity onPress={closePostActions} style={styles.modalCloseButton} activeOpacity={0.8} disabled={isPostActionSaving}>
                  <Ionicons name="close" size={22} color="#31429B" />
                </TouchableOpacity>
              </View>

              <Text style={styles.modalHelperText}>Edit the content, change visibility, save it as a draft, or delete it.</Text>

              <View style={styles.postActionRow}>
                <TouchableOpacity style={styles.postActionButton} activeOpacity={0.85} onPress={handleEditPost} disabled={isPostActionSaving}>
                  <Ionicons name="create-outline" size={15} color="#31429B" />
                  <Text style={styles.postActionButtonText}>Edit</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.postActionButton} activeOpacity={0.85} onPress={handleToggleDraft} disabled={isPostActionSaving}>
                  <Ionicons name={postActionPost?.is_draft ? 'cloud-upload-outline' : 'bookmark-outline'} size={15} color="#31429B" />
                  <Text style={styles.postActionButtonText}>{postActionPost?.is_draft ? 'Publish' : 'Draft'}</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.postActionSectionLabel}>Who can view this post?</Text>
              <View style={styles.postVisibilityRow}>
                {['public', 'friends', 'private'].map((visibility) => {
                  const isSelected = postActionPost?.visibility === visibility || (!postActionPost?.visibility && visibility === 'public');

                  return (
                    <TouchableOpacity
                      key={visibility}
                      style={[styles.postVisibilityPill, isSelected && styles.postVisibilityPillSelected]}
                      activeOpacity={0.85}
                      onPress={() => handleChangeVisibility(visibility)}
                      disabled={isPostActionSaving}
                    >
                      <Text style={styles.postVisibilityPillText}>{visibilityLabels[visibility]}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <TouchableOpacity
                style={styles.postDeleteButton}
                activeOpacity={0.85}
                onPress={handleDeletePost}
                disabled={isPostActionSaving}
              >
                <Ionicons name="trash-outline" size={15} color="#B91C1C" />
                <Text style={styles.postDeleteButtonText}>Delete Post</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Biography Modal */}
        <Modal
          visible={isBioModalVisible}
          transparent
          animationType="fade"
          onRequestClose={closeBioModal}
        >
          <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Edit Biography</Text>
                <TouchableOpacity onPress={closeBioModal} style={styles.modalCloseButton} activeOpacity={0.8}>
                  <Ionicons name="close" size={22} color="#31429B" />
                </TouchableOpacity>
              </View>

              <Text style={styles.modalHelperText}>Update your biography so people can learn more about you.</Text>

              <TextInput
                value={bioDraft}
                onChangeText={setBioDraft}
                placeholder="Write your biography here..."
                placeholderTextColor="#94A3B8"
                multiline
                textAlignVertical="top"
                style={styles.bioInput}
                maxLength={1000}
              />

              <View style={styles.modalButtonRow}>
                <TouchableOpacity style={[styles.modalActionButton, styles.modalCancelButton]} activeOpacity={0.85} onPress={closeBioModal}>
                  <Text style={styles.modalCancelButtonText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.modalActionButton, styles.modalSaveButton]} activeOpacity={0.85} onPress={saveBiography}>
                  <Text style={styles.modalSaveButtonText}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </Modal>

        {/* Work Experience Modal */}
        <Modal visible={isWorkModalVisible} transparent animationType="fade" onRequestClose={closeWorkModal}>
          <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <View style={styles.modalCard}>
              <ScrollView showsVerticalScrollIndicator={true} scrollEnabled={true}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Edit Work Experience</Text>
                  <TouchableOpacity onPress={closeWorkModal} style={styles.modalCloseButton} activeOpacity={0.8} disabled={isWorkSaving}>
                    <Ionicons name="close" size={22} color="#31429B" />
                  </TouchableOpacity>
                </View>

                <Text style={styles.modalHelperText}>Add or update your work experience.</Text>

                <TextInput value={workDraft.title} onChangeText={(t) => setWorkDraft((d) => ({ ...d, title: t }))} placeholder="Position / Title" placeholderTextColor="#94A3B8" style={styles.input} maxLength={150} />
                <TextInput value={workDraft.subtitle} onChangeText={(t) => setWorkDraft((d) => ({ ...d, subtitle: t }))} placeholder="Company / Organization" placeholderTextColor="#94A3B8" style={styles.input} maxLength={150} />
                <View style={{ flexDirection: 'row', gap: 12, marginBottom: 12 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 12, color: '#64748B', marginBottom: 4, fontWeight: '500' }}>Start Year</Text>
                    <TouchableOpacity
                      onPress={() => setYearDropdownType('start')}
                      style={[styles.input, { justifyContent: 'center', paddingVertical: 12 }]}
                    >
                      <Text style={{ color: workDraft.startYear ? '#1E293B' : '#94A3B8' }}>
                        {workDraft.startYear ? String(workDraft.startYear) : 'Select year...'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 12, color: '#64748B', marginBottom: 4, fontWeight: '500' }}>End Year</Text>
                    <TouchableOpacity
                      onPress={() => setYearDropdownType('end')}
                      style={[styles.input, { justifyContent: 'center', paddingVertical: 12 }]}
                    >
                      <Text style={{ color: workDraft.endYear ? '#1E293B' : '#94A3B8' }}>
                        {workDraft.endYear ? String(workDraft.endYear) : 'Select year...'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              <TextInput value={workDraft.location} onChangeText={(t) => setWorkDraft((d) => ({ ...d, location: t }))} placeholder="Location" placeholderTextColor="#94A3B8" style={styles.input} maxLength={120} />
              <TextInput value={workDraft.description} onChangeText={(t) => setWorkDraft((d) => ({ ...d, description: t }))} placeholder="Brief description" placeholderTextColor="#94A3B8" multiline textAlignVertical="top" style={[styles.bioInput, { minHeight: 80 }]} maxLength={1000} />
              </ScrollView>

              <View style={styles.modalButtonRow}>
                <TouchableOpacity style={[styles.modalActionButton, styles.modalCancelButton]} activeOpacity={0.85} onPress={closeWorkModal} disabled={isWorkSaving}>
                  <Text style={styles.modalCancelButtonText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.modalActionButton, styles.modalSaveButton]} activeOpacity={0.85} onPress={saveWorkExperience} disabled={isWorkSaving}>
                  <Text style={styles.modalSaveButtonText}>{isWorkSaving ? 'Saving...' : 'Save'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </Modal>

        {/* Year Selection Modal */}
        <Modal visible={yearDropdownType !== null} transparent animationType="fade">
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 16 }}>
            <View style={{ backgroundColor: '#FFF', borderRadius: 12, maxHeight: '70%', width: '100%' }}>
              <View style={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: '#E2E8F0' }}>
                <Text style={{ fontSize: 16, fontWeight: '600', color: '#1E293B' }}>
                  {yearDropdownType === 'start' ? 'Select Start Year' : 'Select End Year'}
                </Text>
              </View>
              <ScrollView style={{ paddingVertical: 8 }}>
                <TouchableOpacity
                  onPress={() => {
                    if (yearDropdownType === 'start') {
                      setWorkDraft((d) => ({ ...d, startYear: null }));
                    } else {
                      setWorkDraft((d) => ({ ...d, endYear: null }));
                    }
                    setYearDropdownType(null);
                  }}
                  style={{ paddingVertical: 12, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' }}
                >
                  <Text style={{ fontSize: 14, color: '#64748B' }}>Clear selection</Text>
                </TouchableOpacity>
                {Array.from({ length: 75 }, (_, i) => 2025 - i).map((year) => (
                  <TouchableOpacity
                    key={year}
                    onPress={() => {
                      if (yearDropdownType === 'start') {
                        setWorkDraft((d) => ({ ...d, startYear: year }));
                      } else {
                        setWorkDraft((d) => ({ ...d, endYear: year }));
                      }
                      setYearDropdownType(null);
                    }}
                    style={[
                      { paddingVertical: 12, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
                      (yearDropdownType === 'start' ? workDraft.startYear === year : workDraft.endYear === year) && { backgroundColor: '#EFF6FF' },
                    ]}
                  >
                    <Text
                      style={{
                        fontSize: 14,
                        color: (yearDropdownType === 'start' ? workDraft.startYear === year : workDraft.endYear === year) ? '#31429B' : '#1E293B',
                        fontWeight: (yearDropdownType === 'start' ? workDraft.startYear === year : workDraft.endYear === year) ? '600' : '400',
                      }}
                    >
                      {year}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
};

export default UserProfileScreen;