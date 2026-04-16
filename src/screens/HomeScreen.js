import React, { useState, useEffect, useRef } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, ActivityIndicator, Modal, FlatList, ImageBackground, Linking, Animated, Pressable
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import api from '../services/api';

const HomeScreen = () => {

    const [userData, setUserData] = useState(null);
    const [isNotifVisible, setIsNotifVisible] = useState(false);
    const [notifications, setNotifications] = useState([]);
  const [isIdFlipped, setIsIdFlipped] = useState(false);
  const flipAnimation = useRef(new Animated.Value(0)).current;

    // NEW: side menu state/animation
    const [isMenuVisible, setIsMenuVisible] = useState(false);
    const menuTranslateX = useRef(new Animated.Value(-320)).current;

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
        {/* 1. TOP HEADER */}
        <View style={styles.header}>
          <Image 
            source={require('../../assets/images/lumi-n-us-logo-landscape-2.png')} 
            style={styles.headerLogoImage} 
            resizeMode="contain" 
          />
          <View style={styles.badgeContainer}>
            <Text style={styles.badgeText}>NU LIPA</Text>
          </View>
        </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.mainScrollContent}
      >
        
        {/* 2. USER PROFILE GREETING */}
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

          <TouchableOpacity style={styles.bellIcon} onPress={() => setIsNotifVisible(true)}>
            <Ionicons name="notifications" size={24} color="#00205B" />
          </TouchableOpacity>
        </View>

        {/* 3. DIGITAL ALUMNI ID CARD */}
        <View style={styles.idSection}>

          <Pressable onPress={toggleIdCard}>
            <View style={styles.idCardPerspective}>
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
                      uri:
                        userData?.alumni_photo ||
                        'https://ui-avatars.com/api/?name=Alumni&background=E5E7EB&color=111827'
                    }}
                    style={styles.idPhoto}
                    resizeMode="cover"
                  />

                  {/* Text overlay (left-bottom) */}
                  <View style={styles.idCardContent}>
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

        {/* 4. WHAT'S NEW (Horizontal Scroll) */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>What's New</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
            
            {/* Pickle Bark Promo Card Built with Text */}
            <View style={styles.promoCard}>
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
            <View style={[styles.promoCard, { backgroundColor: '#E2E8F0' }]}>
               <View style={styles.promoRight}>
                  <Text style={styles.promoEyebrow}>COMING SOON</Text>
                  <Text style={styles.promoTitleMain}>ALUMNI</Text>
                  <Text style={styles.promoTitleSub}>HOMECOMING</Text>
               </View>
            </View>

          </ScrollView>
        </View>

        {/* 5. QUICK LINKS */}
        <View style={[styles.sectionContainer, styles.quickLinksSection]}>
          <Text style={styles.sectionTitle}>Quick Links</Text>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.quickLinksScrollContent}
          >
            <TouchableOpacity style={styles.quickLinkBox}>
              <Image source={require('../../assets/images/view-yearbook-icon.png')} style={styles.quickLinkIcon} />
              <Text style={styles.quickLinkText}>View My{'\n'}Yearbook</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.quickLinkBox}>
              <Image source={require('../../assets/images/view-events-icon.png')} style={styles.quickLinkIcon} />
              <Text style={styles.quickLinkText}>View{'\n'}Events</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.quickLinkBox} onPress={openNUWebsite}>
              <Image source={require('../../assets/images/nulogo.png')} style={styles.quickLinkIcon} />
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
                <TouchableOpacity style={styles.menuItem}>
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
                <TouchableOpacity style={styles.signOutButton}>
                  <Text style={styles.signOutButtonText}>Sign Out</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          </View>
        </Modal>

        {/* --- NOTIFICATIONS MODAL --- */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={isNotifVisible}
          onRequestClose={() => setIsNotifVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              
              {/* Top Blue Header */}
              <View style={styles.modalHeader}>
                <TouchableOpacity onPress={() => setIsNotifVisible(false)} style={styles.closeBtn}>
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
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeAreaTop: { flex: 1, backgroundColor: '#31429B' },
  container: { flex: 1, backgroundColor: '#F5F6F8' },
  mainScrollContent: {
    paddingBottom: 4,
    backgroundColor: '#F5F6F8',
  },
  header: { 
    backgroundColor: '#31429B', padding: 15, flexDirection: 'row', 
    justifyContent: 'space-between', alignItems: 'center' 
  },
headerLogoImage: { 
    width: 140,  // Tweak this number to make it wider or narrower
    height: 35,  // Locks the height so it doesn't push the header down
  },  badgeContainer: { backgroundColor: '#FFF', paddingHorizontal: 15, paddingVertical: 5, borderRadius: 20 },
  badgeText: { color: '#31429B', fontWeight: 'bold' },
  
  profileSection: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, alignItems: 'center' },
  profileInfo: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 50, height: 50, borderRadius: 25, marginRight: 15 },
  greeting: { fontSize: 20, fontWeight: 'bold', color: '#31429B' },
  studentId: { fontSize: 12, color: '#666' },
  bellIcon: { backgroundColor: '#F2C919', padding: 8, borderRadius: 20 },

  idSection: { paddingHorizontal: 20, marginBottom: 20 },
  tabRow: { flexDirection: 'row', marginBottom: -10, zIndex: 1, marginLeft: 15 },
  activeTab: { backgroundColor: '#F2C919', paddingVertical: 8, paddingHorizontal: 20, borderTopLeftRadius: 10, borderTopRightRadius: 10 },
  activeTabText: { color: '#31429B', fontWeight: 'bold' },
  inactiveTab: { backgroundColor: '#E0E0E0', paddingVertical: 8, paddingHorizontal: 20, borderTopLeftRadius: 10, borderTopRightRadius: 10, marginLeft: 10 },
  inactiveTabText: { color: '#666' },
  
  idCard: {
    borderRadius: 15,
    overflow: 'hidden',
    elevation: 5,
    backgroundColor: '#0A1142',
    aspectRatio: 378 / 236,
  },
  idCardPerspective: {
    position: 'relative',
    aspectRatio: 378 / 236,
    perspective: 1000,
  },
  idCardFace: {
    ...StyleSheet.absoluteFillObject,
    backfaceVisibility: 'hidden',
    borderRadius: 15,
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
    borderRadius: 15,
  },
  idPhoto: {
    position: 'absolute',
    top: '12%',
    right: '2.5%',
    width: '28.7%',
    height: '59%',
    borderRadius: 2,
    backgroundColor: '#E5E7EB',
  },
  idCardContent: {
    position: 'absolute',
    top: '35%',
    left: '5%',
    bottom: '18%',
    width: '60%',
  },
  idName: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    lineHeight: 16,
  },
  idCourse: {
    color: '#FFFFFF',
    fontSize: 11,
    marginTop: 3,
  },
  idClass: {
    color: '#FFFFFF',
    fontSize: 11,
    marginTop: 1,
  },
  idBackImage: {
    width: '100%',
    height: '100%',
  },

  sectionContainer: { paddingHorizontal: 20, marginBottom: 25 },
  quickLinksSection: { marginBottom: 8 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#31429B', marginBottom: 15 },
  horizontalScroll: { flexDirection: 'row' },
  promoCard: { width: 280, height: 130, backgroundColor: '#FDEAA6', borderRadius: 10, marginRight: 15 },
  
  quickLinksRow: { flexDirection: 'row', justifyContent: 'space-between' },
  quickLinksScrollContent: {
    paddingRight: 8,
  },
  quickLinkBox: { 
    width: 152,
    minHeight: 10,
    backgroundColor: '#FFF',
    paddingVertical: 20,
    paddingHorizontal: 14,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
    elevation: 2,
  },
  quickLinkText: {
    marginLeft: 12,
    color: '#31429B',
    fontWeight: 'bold',
    fontSize: 15,
    lineHeight: 21,
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
    justifyContent: 'flex-end', // Pushes the modal to the bottom
  },
  modalContainer: {
    backgroundColor: '#FFF',
    height: '85%', // Takes up 85% of the screen
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    overflow: 'hidden',
    marginTop: 50,
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