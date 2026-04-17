import React, { useState, useEffect, useRef } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, ActivityIndicator, Modal, FlatList, ImageBackground, Linking, Animated, Pressable, Dimensions, useWindowDimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import api from '../services/api';
import BrandHeader from '../components/BrandHeader';
import { responsiveHeight, responsiveWidth } from '../utils/responsive';

const HomeScreen = ({ navigation }) => {
  const { width, height } = useWindowDimensions();
  const isCompactWidth = width < 375;
  const isTablet = width >= 768;
  const layout = {
    headerLogoWidth: responsiveWidth(width, 0.28, 122, isTablet ? 176 : 146),
    headerLogoHeight: responsiveHeight(height, 0.045, 30, 42),
    horizontalPadding: isTablet ? 28 : isCompactWidth ? 16 : 20,
    idCardHeight: responsiveWidth(width, 0.62, 204, isTablet ? 320 : 250),
    idPhotoWidth: responsiveWidth(width, 0.28, 62, isTablet ? 138 : 112),
    idPhotoHeight: responsiveWidth(width, 0.42, 96, isTablet ? 160 : 128),
    idPhotoRight: isCompactWidth ? '.6%' : '1.9%',
    idPhotoTop: isCompactWidth ? '13.3%' : '13.5%',
    idContentTop: isCompactWidth ? '24%' : '26%',
    idContentWidth: isCompactWidth ? '65%' : '70.62%',
    promoCardWidth: responsiveWidth(width, 0.75, 240, isTablet ? 360 : 300),
    promoCardHeight: responsiveHeight(height, 0.17, 118, 150),
    quickLinkWidth: responsiveWidth(width, 0.42, 150, isTablet ? 230 : 192),
    quickLinkIconSize: responsiveWidth(width, 0.09, 28, 42),
    quickLinkIconNUSize: responsiveWidth(width, 0.07, 24, 34),
    quickLinksOverlap: isCompactWidth ? -10 : -18,
    menuWidth: responsiveWidth(width, 0.9, 280, 340),
    notifWidth: responsiveWidth(width, 0.88, 300, 420),
  };

    const [userData, setUserData] = useState(null);
    const [notifications, setNotifications] = useState([]);
  const [isIdFlipped, setIsIdFlipped] = useState(false);
  const flipAnimation = useRef(new Animated.Value(0)).current;

    // NEW: side menu state/animation
    const [isMenuVisible, setIsMenuVisible] = useState(false);
    const menuTranslateX = useRef(new Animated.Value(-320)).current;

    // Notifications panel animation (slide from right)
    const [isNotifVisible, setIsNotifVisible] = useState(false);
    const notifTranslateX = useRef(new Animated.Value(Dimensions.get('window').width)).current;

    const openNotifications = () => {
      setIsNotifVisible(true);
      requestAnimationFrame(() => {
        Animated.timing(notifTranslateX, {
          toValue: 0,
          duration: 220,
          useNativeDriver: true,
        }).start();
      });
    };

    const closeNotifications = () => {
      Animated.timing(notifTranslateX, {
        toValue: Dimensions.get('window').width,
        duration: 180,
        useNativeDriver: true,
      }).start(() => setIsNotifVisible(false));
    };

    const openMenu = () => {
        setIsMenuVisible(true)
        requestAnimationFrame(() => {
            Animated.timing(menuTranslateX, {
                toValue: 0,
                duration: 220,
                useNativeDriver: true,
            }).start();
        });
    };

    const closeMenu = () => {
        Animated.timing(menuTranslateX, {
            toValue: -320,
            duration: 200,
            useNativeDriver: true,
        }).start(() => setIsMenuVisible(false));
    };

    useEffect(() => {
    const fetchUserData = async () => {
      try {
        // 1. Grab the VIP pass (token) from the phone's secure vault
        const token = await SecureStore.getItemAsync('userToken');
        
        if (token) {
          // 2. Show the token to Laravel and ask for the user's profile
          const response = await api.get('/user', {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          // 3. Save the database row into our React state
          setUserData(response.data);
        }
      } catch (error) {
        console.error("Failed to fetch user profile:", error);
      }
    };

    fetchUserData();
  }, []);

  const openNUWebsite = async () => {
    const url = 'https://national-u.edu.ph/';
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
    } else {
      console.error('Cannot open URL:', url);
    }
  };

  const openAccountSettings = () => {
    closeMenu();
    const parentNavigator = navigation.getParent?.();

    if (parentNavigator?.navigate) {
      parentNavigator.navigate('AccountSettings');
      return;
    }

    navigation.navigate('AccountSettings');
  };

  const signOut = async () => {
    // close the menu first
    closeMenu();
    try {
      await SecureStore.deleteItemAsync('userToken');
      await SecureStore.deleteItemAsync('userEmail');
    } catch (err) {
      console.error('Failed to clear secure store during sign out', err);
    }

    // Try to replace the root stack to the Login screen. If this navigator
    // is nested (Tab -> Stack), walk up parents to reach the stack.
    const parent = navigation.getParent?.();
    const root = parent?.getParent?.() ?? parent;

    if (root?.replace) {
      root.replace('Login');
    } else {
      navigation.replace('Login');
    }
  };

  const toggleIdCard = () => {
    const nextValue = isIdFlipped ? 0 : 1;

    Animated.timing(flipAnimation, {
      toValue: nextValue,
      duration: 450,
      useNativeDriver: true,
    }).start(() => {
      setIsIdFlipped(!isIdFlipped);
    });
  };

  const frontRotateY = flipAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  const backRotateY = flipAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: ['180deg', '360deg'],
  });

  const notifData = Array.isArray(notifications) ? notifications : [];

  const renderEmptyNotifications = () => (
    <View style={styles.emptyNotifWrap}>
      <Text style={styles.emptyNotifText}>No notifications yet.</Text>
    </View>
  );

  const renderNotificationItem = ({ item }) => {
    const name = String(item?.name ?? 'Unknown User');
    const time = String(item?.time ?? '');
    const avatarUri = item?.avatar
      ? String(item.avatar)
      : 'https://ui-avatars.com/api/?name=Alumni&background=E5E7EB&color=111827';

    return (
      <View style={styles.notifCard}>
        <Image source={{ uri: avatarUri }} style={styles.notifAvatar} />
        <View style={styles.notifBody}>
          <Text style={styles.notifName}>{name}</Text>
          <Text style={styles.notifAction}>sent you a connection request.</Text>
          {!!time && <Text style={styles.notifTime}>{time}</Text>}

          <View style={styles.notifButtonsRow}>
            <TouchableOpacity style={styles.btnAccepted}>
              <Text style={styles.btnAcceptedText}>Accepted</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.btnDelete}>
              <Text style={styles.btnDeleteText}>Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeAreaTop} edges={['top']}>
      <View style={styles.container}>
        <BrandHeader />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.mainScrollContent}
      >
        {/* 2. USER PROFILE GREETING + ID CARD (card wrapper with shadow) */}
        <View style={styles.profileCardWrapper}>
          <View style={styles.profileSection}>
          {/* CHANGED: make dynamic avatar section pressable */}
          <TouchableOpacity style={styles.profileInfo} activeOpacity={0.8} onPress={openMenu}>
            <Image 
              source={{ 
                uri: userData?.alumni_photo 
                  ? userData.alumni_photo 
                  : `https://ui-avatars.com/api/?name=${userData?.first_name}+${userData?.last_name}&background=31429B&color=fff`
              }} 
              style={styles.avatar} 
            />
            <View>
              <Text style={styles.greeting}>
                Hi, {userData ? `${userData.first_name}` : 'Loading...'}!
              </Text>
              <Text style={styles.studentId}>
                Student {userData ? userData.student_id_number : '...'}
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.bellIcon} onPress={openNotifications}>
            <Ionicons name="notifications" size={24} color="#00205B" />
          </TouchableOpacity>
        </View>

        {/* 3. DIGITAL ALUMNI ID CARD */}
        <View style={styles.idSection}>

          <Pressable onPress={toggleIdCard}>
            <View style={[styles.idCardPerspective, { height: layout.idCardHeight }]}>
              <Animated.View
                style={[
                  styles.idCardFace,
                  styles.idCardFrontFace,
                  { transform: [{ rotateY: frontRotateY }] },
                ]}
              >
                <ImageBackground
                  source={require('../../assets/images/BlankID_Front 1.png')}
                  style={styles.idBackground}
                  imageStyle={styles.idBackgroundImage}
                  resizeMode="cover"
                >
                  {/* Photo area (right side) */}
                  <Image
                    source={{ 
                uri: userData?.alumni_photo 
                  ? userData.alumni_photo 
                  : `https://ui-avatars.com/api/?name=${userData?.first_name}+${userData?.last_name}&background=31429B&color=fff`
              }} 
                    style={[
                      styles.idPhoto,
                      {
                        width: layout.idPhotoWidth,
                        height: layout.idPhotoHeight,
                        right: layout.idPhotoRight,
                        top: layout.idPhotoTop,
                      },
                    ]}
                    resizeMode="cover"
                  />

                  {/* Text overlay (left-bottom) */}
                  <View style={[styles.idCardContent, { top: layout.idContentTop, width: layout.idContentWidth }]}>
                    <Text style={styles.idName}>
                      {userData ? `${userData.first_name}\n${userData.last_name}`.toUpperCase() : 'LOADING...'}
                    </Text>
                    <Text style={styles.idCourse}>BSIT-MWA</Text>
                    <Text style={styles.idClass}>Class of 2023</Text>
                  </View>
                </ImageBackground>
              </Animated.View>

              <Animated.View
                style={[
                  styles.idCardFace,
                  styles.idCardBackFace,
                  { transform: [{ rotateY: backRotateY }] },
                ]}
              >
                <Image
                  source={require('../../assets/images/BlankID_Back 1.png')}
                  style={styles.idBackImage}
                  resizeMode="cover"
                />
              </Animated.View>
            </View>
          </Pressable>
        </View>
        </View>

    
        {/* 4. WHAT'S NEW (Horizontal Scroll) */}
        <View style={[styles.sectionContainer, { paddingHorizontal: layout.horizontalPadding }]}>
          <Text style={styles.sectionTitle}>What's New</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
            
            {/* Pickle Bark Promo Card Built with Text */}
            <View style={[styles.promoCard, { width: layout.promoCardWidth, height: layout.promoCardHeight }]}>
              <View style={styles.promoLeft} />

              <View style={styles.promoRight}>
                <Text style={styles.promoEyebrow}>OPEN PLAY</Text>
                <Text style={styles.promoTitleMain}>PICKLE</Text>
                <Text style={styles.promoTitleSub}>BARK</Text>
                <Text style={styles.promoDate}>March 14, 2026</Text>
                <Text style={styles.promoLocation}>GoldenTop Sports Center</Text>
              </View>
            </View>

            {/* A second placeholder card so you can test scrolling */}
            <View style={[styles.promoCard, { width: layout.promoCardWidth, height: layout.promoCardHeight, backgroundColor: '#E2E8F0' }]}>
               <View style={styles.promoRight}>
                  <Text style={styles.promoEyebrow}>COMING SOON</Text>
                  <Text style={styles.promoTitleMain}>ALUMNI</Text>
                  <Text style={styles.promoTitleSub}>HOMECOMING</Text>
               </View>
            </View>

          </ScrollView>
        </View>

        {/* 5. QUICK LINKS */}
        <View style={[styles.sectionContainer, styles.quickLinksSection, { paddingHorizontal: layout.horizontalPadding, marginBottom: layout.quickLinksOverlap }]}>
          <Text style={styles.sectionTitle}>Quick Links</Text>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.quickLinksScrollContent}
          >
            <TouchableOpacity style={[styles.quickLinkBox, { width: layout.quickLinkWidth }]}>
              <Image source={require('../../assets/images/view-yearbook-icon.png')} style={[styles.quickLinkIcon, { width: layout.quickLinkIconSize, height: layout.quickLinkIconSize }]} />
              <Text style={styles.quickLinkText}>View My{'\n'}Yearbook</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.quickLinkBox, { width: layout.quickLinkWidth }]}>
              <Image source={require('../../assets/images/view-events-icon.png')} style={[styles.quickLinkIcon, { width: layout.quickLinkIconSize, height: layout.quickLinkIconSize }]} />
              <Text style={styles.quickLinkText}>View{'\n'}Events</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.quickLinkBox, { width: layout.quickLinkWidth }]} onPress={openNUWebsite}>
              <Image source={require('../../assets/images/nulogo.png')} style={[styles.quickLinkIconNU, { width: layout.quickLinkIconNUSize, height: layout.quickLinkIconNUSize }]} />
              <Text style={styles.quickLinkText}>National-U{'\n'}Website</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

      </ScrollView>

        {/* NEW: LEFT SLIDE MENU */}
        <Modal
          transparent
          visible={isMenuVisible}
          animationType="none"
          onRequestClose={closeMenu}
        >
          <View style={styles.sideMenuRoot}>
            <Pressable style={styles.sideMenuOverlay} onPress={closeMenu} />
            <Animated.View
              style={[
                styles.sideMenuContainer,
                { width: layout.menuWidth },
                { transform: [{ translateX: menuTranslateX }] }
              ]}
            >
              <View style={styles.sideMenuHeader}>
                <Text style={styles.sideMenuTitle}>Menu</Text>
                <TouchableOpacity onPress={closeMenu}>
                  <Ionicons name="close" size={34} color="#F2C919" />
                </TouchableOpacity>
              </View>

              <View style={styles.sideMenuAccent} />

              <View style={styles.sideMenuBody}>
                <TouchableOpacity style={styles.menuItem} onPress={openAccountSettings}>
                  <View style={styles.menuIconCircle}>
                    <Ionicons name="person-outline" size={22} color="#31429B" />
                  </View>
                  <View style={styles.menuTextWrap}>
                    <Text style={styles.menuItemTitle}>Account Settings</Text>
                    <Text style={styles.menuItemSub}>Manage Your Information</Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity style={styles.menuItem}>
                  <View style={styles.menuIconCircle}>
                    <Ionicons name="people-outline" size={22} color="#31429B" />
                  </View>
                  <View style={styles.menuTextWrap}>
                    <Text style={styles.menuItemTitle}>My Connections</Text>
                    <Text style={styles.menuItemSub}>View Your Connections</Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity style={styles.menuItem}>
                  <View style={styles.menuIconCircle}>
                    <Ionicons name="reader-outline" size={22} color="#31429B" />
                  </View>
                  <View style={styles.menuTextWrap}>
                    <Text style={styles.menuItemTitle}>My Registrations</Text>
                    <Text style={styles.menuItemSub}>View Your Event Registrations</Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity style={styles.menuItem}>
                  <View style={styles.menuIconCircle}>
                    <Ionicons name="book-outline" size={22} color="#31429B" />
                  </View>
                  <View style={styles.menuTextWrap}>
                    <Text style={styles.menuItemTitle}>Get your Master’s or Second Degree</Text>
                    <Text style={styles.menuItemSub}>Continue studying your chosen field</Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity style={styles.menuItem}>
                  <View style={styles.menuIconCircle}>
                    <Ionicons name="search-outline" size={22} color="#31429B" />
                  </View>
                  <View style={styles.menuTextWrap}>
                    <Text style={styles.menuItemTitle}>Explore the App</Text>
                    <Text style={styles.menuItemSub}>Take a Tour of the App!</Text>
                  </View>
                </TouchableOpacity>
              </View>

              <View style={styles.sideMenuFooter}>
                <TouchableOpacity style={styles.signOutButton} onPress={signOut}>
                  <Text style={styles.signOutButtonText}>Sign Out</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          </View>
        </Modal>

        {/* --- NOTIFICATIONS SIDE PANEL (slides in from right) --- */}
        <Modal
          animationType="none"
          transparent={true}
          visible={isNotifVisible}
          onRequestClose={closeNotifications}
        >
          <View style={[styles.modalOverlay, { alignItems: 'flex-end', justifyContent: 'flex-start' }]}>
            <Animated.View
              style={[
                styles.modalSideContainer,
                { width: layout.notifWidth },
                { transform: [{ translateX: notifTranslateX }] }
              ]}
            >
              {/* Top Blue Header */}
              <View style={styles.modalHeader}>
                <TouchableOpacity onPress={closeNotifications} style={styles.closeBtn}>
                  <Ionicons name="close" size={28} color="#F2C919" />
                </TouchableOpacity>
                <Text style={styles.modalTitle}>Notifications</Text>
                <View style={styles.modalHeaderSpacer} />
              </View>

              {/* Yellow Accent Line */}
              <View style={styles.modalAccentLine} />

              {/* Notification List */}
              <FlatList
                data={notifData}
                keyExtractor={(item, index) => String(item?.id ?? index)}
                contentContainerStyle={styles.notifList}
                ListEmptyComponent={renderEmptyNotifications}
                renderItem={renderNotificationItem}
              />
            </Animated.View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeAreaTop: { flex: 1, backgroundColor: '#31429B' },
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  mainScrollContent: {
    paddingBottom: 0,
    backgroundColor: '#FFFFFF',
  },
  brandHeader: {
    backgroundColor: '#31429B',
  },
  brandRow: {
    backgroundColor: '#31429B',
    paddingHorizontal: 18,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  brandAccent: {
    height: 10,
    backgroundColor: '#F2C919',
    width: '100%',
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
  nulipaText: { color: '#31429B', fontWeight: '800', fontSize: 14, letterSpacing: 0.3 },
  
  profileSection: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14, alignItems: 'center' },
  profileInfo: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 56, height: 56, borderRadius: 28, marginRight: 14, borderWidth: 2, borderColor: '#F2C919' },
  greeting: { fontSize: 20, fontWeight: '800', color: '#0A1142' },
  studentId: { fontSize: 12, color: '#666', marginTop: 2 },
  bellIcon: { backgroundColor: '#F2C919', padding: 8, borderRadius: 20 },

  idSection: { paddingHorizontal: 0, marginBottom: 18 },

  profileCardWrapper: {
    marginTop: -8,
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    paddingHorizontal: 14,
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    marginBottom: 18,
  },

  profileSection: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 8, paddingVertical: 14, alignItems: 'center' },
  tabRow: { flexDirection: 'row', marginBottom: -10, zIndex: 1, marginLeft: 15 },
  activeTab: { backgroundColor: '#F2C919', paddingVertical: 8, paddingHorizontal: 20, borderTopLeftRadius: 10, borderTopRightRadius: 10 },
  activeTabText: { color: '#31429B', fontWeight: 'bold' },
  inactiveTab: { backgroundColor: '#E0E0E0', paddingVertical: 8, paddingHorizontal: 20, borderTopLeftRadius: 10, borderTopRightRadius: 10, marginLeft: 10 },
  inactiveTabText: { color: '#666' },
  
  idCard: {
    borderRadius: 5,
    overflow: 'hidden',
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    backgroundColor: '#0A1142',
    height: 220,
    
  },
  idCardPerspective: {
    position: 'relative',
    height: 220,
    perspective: 1000,
    
  },
  idCardFace: {
    ...StyleSheet.absoluteFillObject,
    backfaceVisibility: 'hidden',
    borderRadius: 8,
    overflow: 'hidden',
  },
  idCardFrontFace: {
    zIndex: 2,
  },
  idCardBackFace: {
    zIndex: 1,
  },
  idBackground: {
    flex: 1,
    justifyContent: 'flex-end',
    
    
  },
  idBackgroundImage: {
    borderRadius: 8,
    
  },
  idPhoto: {
    position: 'absolute',
    top: '13%',
    right: '1.3%',
    width: '30%',
    height: '28%',
  },
  idCardContent: {
    position: 'absolute',
    top: '26%',
    left: '6%',
    bottom: '10%',
    width: '62%',
  },
  idName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
    lineHeight: 18,
    top: '7%',
  },
  idCourse: {
    color: '#FFFFFF',
    fontSize: 12,
    marginTop: 6,
    top: '4%',
  },
  idClass: {
    color: '#FFFFFF',
    fontSize: 12,
    marginTop: 2,
    top: '4%',
  },
  idBackImage: {
    width: '100%',
    height: '100%',
  },

  sectionContainer: { paddingHorizontal: 20, marginBottom: 0 },
  quickLinksSection: { marginBottom: -18, paddingBottom: 8, position: 'relative', zIndex: 2 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#31429B', marginBottom: 15 },
  horizontalScroll: { flexDirection: 'row' },
  promoCard: { width: 280, height: 130, backgroundColor: '#FDEAA6', borderRadius: 12, marginRight: 16, padding: 12, overflow: 'hidden' },
  
  quickLinksRow: { flexDirection: 'row', justifyContent: 'space-between' },
  quickLinksScrollContent: {
    paddingRight: 8,
    paddingBottom: 8,
  },
  quickLinkBox: {
    width: 192,
    minHeight: 64,
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    paddingHorizontal: 14,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  quickLinkText: {
    marginLeft: 12,
    color: '#31429B',
    fontWeight: '800',
    fontSize: 14,
    lineHeight: 18,
  },
  quickLinkIcon: {
    width: 36,
    height: 36,
  },
  quickLinkIconNU: {
    width: 26,
    height: 26,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)', // Darkens the background behind the modal
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#FFF',
    height: '85%', // Takes up 85% of the screen
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    overflow: 'hidden',
    marginTop: 50,
  },
  modalSideContainer: {
    backgroundColor: '#FFF',
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: '85%',
    borderTopLeftRadius: 25,
    borderBottomLeftRadius: 25,
    overflow: 'hidden',
  },
  modalHeader: {
    backgroundColor: '#31429B',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
    paddingHorizontal: 20,
  },
  modalTitle: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  modalHeaderSpacer: {
    width: 28,
  },
  closeBtn: { padding: 5 },
  modalAccentLine: {
    height: 5,
    backgroundColor: '#F2C919',
  },
  notifList: {
    padding: 20,
    flexGrow: 1,
  },
  emptyNotifWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 30,
  },
  emptyNotifText: {
    color: '#666',
    fontSize: 14,
  },
  notifCard: {
    flexDirection: 'row',
    marginBottom: 25,
    alignItems: 'flex-start',
  },
  notifAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: '#F2C919',
    marginRight: 15,
  },
  notifBody: {
    flex: 1,
  },
  notifName: {
    color: '#31429B',
    fontWeight: 'bold',
    fontSize: 14,
    lineHeight: 20,
  },
  notifAction: {
    color: '#666',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 2,
  },
  notifTime: {
    color: '#A0A0A0',
    fontSize: 12,
    marginBottom: 8,
  },
  notifButtonsRow: {
    flexDirection: 'row',
  },
  btnAccepted: {
    backgroundColor: '#31429B',
    paddingVertical: 4,
    paddingHorizontal: 15,
    borderRadius: 15,
    marginRight: 10,
  },
  btnAcceptedText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  btnDelete: {
    backgroundColor: '#D3D3D3',
    paddingVertical: 4,
    paddingHorizontal: 15,
    borderRadius: 15,
  },
  btnDeleteText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  sideMenuRoot: {
    flex: 1,
    flexDirection: 'row',
  },
  sideMenuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  sideMenuContainer: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: '90%',
    maxWidth: 340,
    backgroundColor: '#E9E9E9',
    borderTopRightRadius: 26,
    borderBottomRightRadius: 26,
    overflow: 'hidden',
  },
  sideMenuHeader: {
    backgroundColor: '#31429B',
    paddingHorizontal: 20,
    paddingTop: 52,
    paddingBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sideMenuTitle: {
    color: '#FFF',
    fontSize: 28,   // smaller
    fontWeight: '700',
  },
  sideMenuAccent: {
    height: 6,
    backgroundColor: '#F2C919',
  },
  sideMenuBody: {
    flex: 1,
    paddingHorizontal: 18,
    paddingTop: 16,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14, // tighter spacing
  },

  sideMenuFooter: {
    paddingHorizontal: 20,
    paddingBottom: 26,   // move lower/higher by changing this
    paddingTop: 8,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },

  signOutButton: {
    width: '76%',
    backgroundColor: '#FF1515',
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
  },

  menuIconCircle: {
    width: 34,       // smaller icon circle
    height: 34,
    borderRadius: 17,
    backgroundColor: '#F2C919',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuTextWrap: {
    marginLeft: 10,
    flex: 1,
  },
  menuItemTitle: {
    color: '#31429B',
    fontWeight: '700',
    fontSize: 18,    // smaller
  },
  menuItemSub: {
    color: '#4A5FAE',
    fontSize: 11,    // smaller
    fontStyle: 'italic',
    marginTop: 1,
  },
  signOutButton: {
    width: '74%',
    backgroundColor: '#FF1515',
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
  },
  signOutButtonText: {
    color: '#FFF',
    fontSize: 16,    // smaller
    fontWeight: '700',
  },
});

export default HomeScreen;