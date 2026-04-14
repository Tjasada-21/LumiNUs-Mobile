import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, SafeAreaView, ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import api from '../services/api';

const HomeScreen = () => {

    const [userData, setUserData] = useState(null);
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

  return (
    <SafeAreaView style={styles.container}>
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

      <ScrollView showsVerticalScrollIndicator={false}>
        
        {/* 2. USER PROFILE GREETING */}
        <View style={styles.profileSection}>
          <View style={styles.profileInfo}>
            
            {/* Dynamic Avatar with a Fallback */}
            <Image 
              source={{ 
                uri: userData?.alumni_photo 
                  ? userData.alumni_photo 
                  : `https://ui-avatars.com/api/?name=${userData?.first_name}+${userData?.last_name}&background=31429B&color=fff`
              }} 
              style={styles.avatar} 
            />
            
            <View>
              {/* Dynamic Name and Student ID */}
              <Text style={styles.greeting}>
                Hi, {userData ? `${userData.first_name} ${userData.last_name}` : 'Loading...'}!
              </Text>
              <Text style={styles.studentId}>
                Student {userData ? userData.student_id_number : '...'}
              </Text>
            </View>

          </View>
          <TouchableOpacity style={styles.bellIcon}>
            <Ionicons name="notifications" size={24} color="#00205B" />
          </TouchableOpacity>
        </View>

        {/* 3. DIGITAL ALUMNI ID CARD */}
        <View style={styles.idSection}>
          <View style={styles.tabRow}>
            <View style={styles.activeTab}><Text style={styles.activeTabText}>Front Side</Text></View>
            <View style={styles.inactiveTab}><Text style={styles.inactiveTabText}>Back Side</Text></View>
          </View>
          
          <View style={styles.idCard}>
            {/* The blue background and ID details go here */}
            <View style={styles.idCardContent}>
              <Text style={styles.idName}>
                {userData ? `${userData.first_name}\n${userData.last_name}`.toUpperCase() : 'LOADING...'}
              </Text>
              <Text style={styles.idCourse}>BSIT-MWA</Text>
              <Text style={styles.idClass}>Class of 2023</Text>
            </View>
            <View style={styles.idFooter}>
              <Text style={styles.idFooterLeft}>NU LIPA</Text>
              <Text style={styles.idFooterRight}>ALUMNI</Text>
            </View>
          </View>
        </View>

        {/* 4. WHAT'S NEW (Horizontal Scroll) */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>What's New</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
            
            {/* Pickle Bark Promo Card Built with Text */}
            <View style={styles.promoCard}>
              
              {/* Left Side: For your NU Logo & Character images later */}
              <View style={styles.promoLeft}>
                 {/* <Image source={require('../../assets/images/pickle-char.png')} style={styles.promoGraphic} /> */}
              </View>

              {/* Right Side: The actual text layout */}
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
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Quick Links</Text>
          <View style={styles.quickLinksRow}>
            <TouchableOpacity style={styles.quickLinkBox}>
              <Ionicons name="school" size={32} color="#00205B" />
              <Text style={styles.quickLinkText}>View My{'\n'}Yearbook</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickLinkBox}>
              <Ionicons name="calendar" size={32} color="#F2C919" />
              <Text style={styles.quickLinkText}>View{'\n'}Events</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Bottom padding to ensure you can scroll past the bottom bar later */}
        <View style={{ height: 80 }} /> 
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F6F8' },
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
  
  idCard: { backgroundColor: '#0A1142', borderRadius: 15, overflow: 'hidden', elevation: 5 },
  idCardContent: { padding: 20, height: 160, justifyContent: 'flex-end' },
  idName: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  idCourse: { color: '#FFF', fontSize: 12, marginTop: 5 },
  idClass: { color: '#FFF', fontSize: 12 },
  idFooter: { flexDirection: 'row', backgroundColor: '#FFF' },
  idFooterLeft: { flex: 1, backgroundColor: '#F2C919', padding: 10, fontWeight: 'bold', textAlign: 'center', color: '#31429B' },
  idFooterRight: { flex: 1, padding: 10, fontWeight: 'bold', textAlign: 'center', color: '#31429B' },

  sectionContainer: { paddingHorizontal: 20, marginBottom: 25 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#31429B', marginBottom: 15 },
  horizontalScroll: { flexDirection: 'row' },
  promoCard: { width: 280, height: 130, backgroundColor: '#FDEAA6', borderRadius: 10, marginRight: 15 },
  
  quickLinksRow: { flexDirection: 'row', justifyContent: 'space-between' },
  quickLinkBox: { 
    flex: 1, backgroundColor: '#FFF', padding: 20, borderRadius: 10, 
    flexDirection: 'row', alignItems: 'center', marginHorizontal: 5, elevation: 2 
  },
  quickLinkText: { marginLeft: 10, color: '#31429B', fontWeight: 'bold', fontSize: 13 }
});

export default HomeScreen;