import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ActivityIndicator, ScrollView, StatusBar, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import api from '../services/api';

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
    cardHorizontalPadding: isCompactWidth ? 12 : 14,
    nameSize: isCompactWidth ? 19 : 22,
  };

  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        setErrorMessage('');

        const token = await SecureStore.getItemAsync('userToken');

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

  const profileName = userData
    ? [userData.last_name, userData.first_name].filter(Boolean).join(', ').replace(/, ([^,]+)$/, ', $1')
    : 'Dela Cruz, Juan Miguel';

  const profileImageUri = userData?.alumni_photo
    ? userData.alumni_photo
    : `https://ui-avatars.com/api/?name=${encodeURIComponent(profileName)}&background=1F2F6E&color=fff&size=256`;

  const headlineText = userData?.headline || 'Software Engineer at Microsoft';
  const locationText = userData?.location || 'Lipa City, Batangas';
  const classTag = userData?.class_year ? `Class of ${userData.class_year}` : 'Class of 2023';
  const sectionTag = userData?.section || 'BSIT';
  const connectionsCount = userData?.connections_count ?? 123;
  const postsCount = userData?.posts_count ?? 3;
  const biographyText = userData?.bio || 'Class of 2023 | BS Information Technology | Currently a Software Engineer at Microsoft specializing in mobile development. During my stay at NU Lipa, I served as a student leader and fell in love with building tech that solves real-world problems. Passionate about Human-Computer Interaction and clean code. Always down for a coffee chat or a collab on a side project! ☕✨';

  const workExperience = Array.isArray(userData?.work_experiences) && userData.work_experiences.length > 0
    ? userData.work_experiences[0]
    : {
        title: 'Student Developer',
        subtitle: 'NU Lipa - LumiNUs Portal',
        period: '2021 - 2022',
        location: 'Lipa City, Batangas',
        description: "Contributed to the development of the university's alumni portal.",
      };

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
                  <Image source={{ uri: profileImageUri }} style={[styles.avatar, { width: layout.avatarSize, height: layout.avatarSize, borderRadius: layout.avatarSize / 2 }]} />

                  <View style={styles.heroCopy}>
                    <View style={styles.heroTitleRow}>
                      <Text style={[styles.name, { fontSize: layout.nameSize, lineHeight: layout.nameSize + 2 }]}>{profileName}</Text>
                      <TouchableOpacity onPress={openAccountSettings} style={styles.iconButton} activeOpacity={0.8}>
                        <Ionicons name="settings" size={18} color="#FFFFFF" />
                      </TouchableOpacity>
                    </View>

                    <View style={styles.tagPill}>
                      <Ionicons name="school" size={11} color="#31429B" />
                      <Text style={styles.tagText}>{classTag} | {sectionTag}</Text>
                    </View>

                    <View style={styles.statsRow}>
                      <View style={styles.statBlock}>
                        <Text style={styles.statValue}>{connectionsCount}</Text>
                        <Text style={styles.statLabel}>Connections</Text>
                      </View>
                      <View style={styles.statBlock}>
                        <Text style={styles.statValue}>{postsCount}</Text>
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
                    <Text style={styles.aboutText}>{headlineText}</Text>
                  </View>
                  <View style={styles.aboutItem}>
                    <Ionicons name="location-sharp" size={16} color="#404040" />
                    <Text style={styles.aboutText}>{locationText}</Text>
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
                  <Text style={styles.biographyText}>{biographyText}</Text>
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

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  brandHeader: {
    backgroundColor: '#31429B',
  },
  brandRow: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brandLogo: {
    width: 136,
    height: 42,
  },
  nulipaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 7,
    minWidth: 122,
    justifyContent: 'center',
  },
  nulipaIcon: {
    width: 22,
    height: 22,
    marginRight: 6,
  },
  nulipaText: {
    color: '#31429B',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  brandAccent: {
    height: 10,
    backgroundColor: '#F3CB21',
  },
  content: {
    paddingBottom: 18,
    backgroundColor: '#FFFFFF',
  },
  stateWrap: {
    minHeight: 420,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    paddingHorizontal: 20,
  },
  errorText: {
    color: '#B91C1C',
    textAlign: 'center',
    fontSize: 15,
  },
  actionButton: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    backgroundColor: '#31429B',
    borderRadius: 14,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  heroCard: {
    marginTop: 0,
    marginHorizontal: 0,
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 38,
    borderBottomRightRadius: 38,
    padding: 16,
    marginBottom: -24,
    position: 'relative',
    zIndex: 2,
    shadowColor: '#111827',
    shadowOpacity: 0.10,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    backgroundColor: '#E5E7EB',
    marginRight: 14,
  },
  heroCopy: {
    flex: 1,
    minWidth: 0,
  },
  heroTitleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  name: {
    flex: 1,
    paddingRight: 8,
    color: '#384A9C',
    fontSize: 22,
    lineHeight: 24,
    fontWeight: '900',
  },
  iconButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#384A9C',
  },
  tagPill: {
    marginTop: 8,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: '#FFD84D',
  },
  tagText: {
    marginLeft: 4,
    color: '#31429B',
    fontSize: 11,
    fontWeight: '800',
  },
  statsRow: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  statBlock: {
    marginRight: 24,
  },
  statValue: {
    fontSize: 24,
    lineHeight: 26,
    color: '#30343C',
    fontWeight: '500',
  },
  statLabel: {
    marginTop: 2,
    color: '#5C6471',
    fontSize: 12,
  },
  sectionBlock: {
    marginTop: 18,
    paddingHorizontal: 0,
  },
  postsSectionBlock: {
    marginTop: 18,
    paddingHorizontal: 10,
  },
  aboutSectionWrap: {
    marginTop: 1,
    paddingHorizontal: 0,
    position: 'relative',
    zIndex: 1,
  },
  aboutSectionCard: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingTop: 32,
    paddingBottom: 12,
    minHeight: 150,
    shadowColor: '#111827',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  bioSectionCard: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingTop: 22,
    paddingBottom: 12,
    minHeight: 150,
    borderRadius: 22,
    shadowColor: '#111827',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  workSectionCard: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingTop: 22,
    paddingBottom: 12,
    borderRadius: 22,
    shadowColor: '#111827',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  sectionHeading: {
    color: '#404040',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 8,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  editPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: '#B8BCC6',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: '#FFFFFF',
  },
  editPillText: {
    color: '#404040',
    fontSize: 11,
    fontWeight: '700',
  },
  aboutItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    marginBottom: 6,
  },
  aboutText: {
    marginLeft: 8,
    color: '#404040',
    fontSize: 14,
  },
  biographyText: {
    color: '#404040',
    fontSize: 14,
    lineHeight: 20,
    paddingHorizontal: 6,
  },
  workCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingVertical: 12,
    paddingHorizontal: 10,
    shadowColor: '#111827',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  workRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  workNavButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    shadowColor: '#111827',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  workContent: {
    flex: 1,
    paddingHorizontal: 10,
  },
  workTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  workTitle: {
    marginLeft: 6,
    color: '#30343C',
    fontSize: 15,
    fontWeight: '800',
  },
  workSubtitle: {
    marginTop: 2,
    color: '#31429B',
    fontSize: 12,
    fontWeight: '600',
  },
  workPeriod: {
    marginTop: 10,
    color: '#5C6471',
    fontSize: 12,
  },
  workLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  workLocation: {
    marginLeft: 6,
    color: '#5C6471',
    fontSize: 12,
  },
  workDescription: {
    marginTop: 10,
    color: '#404040',
    fontSize: 12,
    lineHeight: 18,
  },
  paginationRow: {
    marginTop: 10,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
  },
  paginationDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    marginHorizontal: 3,
    backgroundColor: '#D9DCE3',
  },
  paginationDotActive: {
    width: 18,
    backgroundColor: '#31429B',
  },
  postsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 16,
    minHeight: 84,
  },
  emptyPostsText: {
    color: '#8A8F9A',
    fontSize: 13,
  },
  stateWrap: {
    minHeight: 420,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    paddingHorizontal: 20,
  },
});

export default UserProfileScreen;