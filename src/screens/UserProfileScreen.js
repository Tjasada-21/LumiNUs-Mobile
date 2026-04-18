import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, Image, TouchableOpacity, ActivityIndicator, ScrollView, StatusBar, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';
import styles from '../styles/UserProfileScreen.styles';
import { getAuthToken } from '../services/authStorage';

const UserProfileScreen = ({ navigation }) => {
  const { width } = useWindowDimensions();
  const isCompactWidth = width < 375;
  const isTablet = width >= 768;
  const layout = {
    brandLogoWidth: isTablet ? 176 : isCompactWidth ? 122 : 146,
    brandLogoHeight: isTablet ? 50 : isCompactWidth ? 32 : 42,
    pillMinWidth: isTablet ? 132 : isCompactWidth ? 108 : 122,
    avatarSize: isTablet ? 118 : isCompactWidth ? 88 : 102,
    heroPadding: isCompactWidth ? 14 : 16,
    nameSize: isCompactWidth ? 19 : 22,
  };

  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  const profileName = useMemo(() => {
    if (!userData) {
      return 'Dela Cruz, Juan Miguel';
    }

    return [userData.last_name, userData.first_name]
      .filter(Boolean)
      .join(', ')
      .replace(/, ([^,]+)$/, ', $1');
  }, [userData]);

  const profileImageUri = useMemo(() => {
    if (userData?.alumni_photo) {
      return userData.alumni_photo;
    }

    return `https://ui-avatars.com/api/?name=${encodeURIComponent(profileName)}&background=1F2F6E&color=fff&size=256`;
  }, [profileName, userData]);

  const profileSummary = useMemo(() => ({
    headlineText: userData?.headline || 'Software Engineer at Microsoft',
    locationText: userData?.location || 'Lipa City, Batangas',
    classTag: userData?.class_year ? `Class of ${userData.class_year}` : 'Class of 2023',
    sectionTag: userData?.section || 'BSIT',
    connectionsCount: userData?.connections_count ?? 123,
    postsCount: userData?.posts_count ?? 3,
    biographyText:
      userData?.bio ||
      'Class of 2023 | BS Information Technology | Currently a Software Engineer at Microsoft specializing in mobile development. During my stay at NU Lipa, I served as a student leader and fell in love with building tech that solves real-world problems. Passionate about Human-Computer Interaction and clean code. Always down for a coffee chat or a collab on a side project! ☕✨',
  }), [userData]);

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

  useEffect(() => {
    const fetchProfile = async () => {
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

        setUserData(response.data?.alumni ?? null);
      } catch (fetchError) {
        console.error('Failed to fetch profile:', fetchError);
        setErrorMessage('Unable to load profile right now.');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

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
      <StatusBar barStyle="light-content" backgroundColor="#31429B" translucent={false} />
      <View style={styles.container}>
        <View style={styles.brandHeader}>
          <View style={styles.brandRow}>
            <Image source={require('../../assets/images/lumi-n-us-logo-landscape-2.png')} style={[styles.brandLogo, { width: layout.brandLogoWidth, height: layout.brandLogoHeight }]} resizeMode="contain" />
            <View style={[styles.nulipaPill, { minWidth: layout.pillMinWidth }]}>
              <Image source={require('../../assets/images/nulogo.png')} style={styles.nulipaIcon} resizeMode="contain" />
              <Text style={styles.nulipaText}>NU LIPA</Text>
            </View>
          </View>
          <View style={styles.brandAccent} />
        </View>

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
                      <View style={styles.statBlock}>
                        <Text style={styles.statValue}>{profileSummary.connectionsCount}</Text>
                        <Text style={styles.statLabel}>Connections</Text>
                      </View>
                      <View style={styles.statBlock}>
                        <Text style={styles.statValue}>{profileSummary.postsCount}</Text>
                        <Text style={styles.statLabel}>Posts</Text>
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
                    <TouchableOpacity style={styles.editPill} activeOpacity={0.8} onPress={openAccountSettings}>
                      <Ionicons name="create-outline" size={12} color="#404040" />
                      <Text style={styles.editPillText}>Edit</Text>
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.biographyText}>{profileSummary.biographyText}</Text>
                </View>
              </View>

              <View style={styles.sectionBlock}>
                <View style={styles.workSectionCard}>
                  <Text style={styles.sectionHeading}>Work Experience</Text>
                  <View style={styles.workCard}>
                    <View style={styles.workRow}>
                      <TouchableOpacity activeOpacity={0.8} style={styles.workNavButton}>
                        <Ionicons name="chevron-back" size={18} color="#31429B" />
                      </TouchableOpacity>

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

                      <TouchableOpacity activeOpacity={0.8} style={styles.workNavButton}>
                        <Ionicons name="chevron-forward" size={18} color="#31429B" />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </View>

              <View style={styles.postsSectionBlock}>
                <Text style={styles.sectionHeading}>Posts</Text>
                <View style={styles.postsCard}>
                  <Text style={styles.emptyPostsText}>No posts yet.</Text>
                </View>
              </View>
            </>
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

export default UserProfileScreen;