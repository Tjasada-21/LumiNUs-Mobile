import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Linking,
  Alert,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { clamp, responsiveWidth } from '../utils/responsive';

const SECTION_DATA = [
  {
    title: 'Alumni Files',
    items: [
      {
        label: 'Digital\nYearbook',
        icon: require('../../assets/images/digital-yearbook-icon-in-blue.png'),
        action: 'goToViewYearbook',
      },
      {
        label: 'NU Alumni ID',
        icon: require('../../assets/images/frame-12.png'),
        action: 'goToAlumniId',
      },
      {
        label: 'Alumni\nTracer',
        icon: require('../../assets/images/trace-icon-in-blue.png'),
        action: 'goToAlumniTracer',
      },
    ],
  },
  {
    title: 'Campus Engagement',
    items: [
      {
        label: 'Registration',
        icon: require('../../assets/images/registration-icon-in-blue-1.png'),
        action: 'goToEventRegistration',
      },
      {
        label: 'University Events',
        icon: require('../../assets/images/view-uni-events-icon-in-blue-1.png'),
        action: 'goToEventsScreen',
      },
      {
        label: 'Messages',
        icon: require('../../assets/images/messages-id-icon-in-blue-1.png'),
        action: 'goToMessages',
      },
    ],
  },
  {
    title: 'Other',
    items: [
      {
        label: 'My Feed',
        icon: require('../../assets/images/feed-icon-in-blue-1.png'),
        action: 'goToFeed',
      },
      {
        label: 'Perks and\nDiscounts',
        icon: require('../../assets/images/view-perks-icon-in-blue-1.png'),
        action: 'goToPerks',
      },
      {
        label: 'NU Website',
        icon: require('../../assets/images/nu-lipa-logo-portrait-white-version-21.png'),
        action: 'openUrl',
        url: 'https://national-u.edu.ph',
      },
    ],
  },
];

const ExploreScreen = ({ navigation }) => {
  const { width } = useWindowDimensions();
  const itemWidth = clamp((width - 52) / 3, 92, 132);
  const iconWrapSize = clamp(width * 0.22, 74, 92);
  const iconSize = clamp(width * 0.15, 48, 60);
  const logoWidth = responsiveWidth(width, 0.52, 174, 240);
  const logoHeight = clamp(width * 0.16, 48, 72);
  const scrollPaddingHorizontal = width < 375 ? 12 : 14;

  const handleItemPress = (item) => {
    if (item.action === 'goToViewYearbook') {
      if (typeof navigation.navigate === 'function') {
        navigation.navigate('ViewYearbook');
      }
      return;
    }

    if (item.action === 'goToAlumniTracer') {
      if (typeof navigation.navigate === 'function') {
        navigation.navigate('AlumniTracer');
      }
      return;
    }

    if (item.action === 'goToEventRegistration') {
      if (typeof navigation.navigate === 'function') {
        navigation.navigate('EventRegistration');
      }
      return;
    }

    if (item.action === 'goToEventsScreen') {
      if (typeof navigation.navigate === 'function') {
        navigation.navigate('EventsScreen');
      }
      return;
    }

    if (item.action === 'goToFeed') {
      if (typeof navigation.jumpTo === 'function') {
        navigation.jumpTo('Feed');
        return;
      }
      navigation.navigate('Feed');
      return;
    }

    if (item.action === 'goToPerks') {
      if (typeof navigation.navigate === 'function') {
        navigation.navigate('Perks');
      }
      return;
    }

    if (item.action === 'goToAlumniId') {
      if (typeof navigation.jumpTo === 'function') {
        navigation.jumpTo('HomeTab');
        return;
      }
      navigation.navigate('HomeTab');
      return;
    }

    if (item.action === 'goToMessages') {
      if (typeof navigation.jumpTo === 'function') {
        navigation.jumpTo('Messages');
        return;
      }
      navigation.navigate('Messages');
    }

    if (item.action === 'openUrl' && item.url) {
      Linking.canOpenURL(item.url)
        .then((supported) => {
          if (supported) {
            return Linking.openURL(item.url);
          }
          throw new Error('Cannot open URL');
        })
        .catch((err) => {
          console.error('Failed to open URL', err);
          Alert.alert('Unable to open link', 'Could not open the website.');
        });
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container}>
        <View style={styles.gradientOverlayTop} />
        <View style={styles.gradientOverlayBottom} />

        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingHorizontal: scrollPaddingHorizontal }]}
          showsVerticalScrollIndicator={false}
        >
          <Image
            source={require('../../assets/images/lumi-n-us-logo-landscape-2.png')}
            style={[styles.logo, { width: logoWidth, height: logoHeight }]}
            resizeMode="contain"
          />

          {SECTION_DATA.map((section) => (
            <View key={section.title} style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>{section.title}</Text>

              <View style={styles.itemRow}>
                {section.items.map((item) => (
                  <TouchableOpacity
                    key={`${section.title}-${item.label}`}
                    style={[styles.itemBtn, { width: itemWidth }]}
                    activeOpacity={0.85}
                    onPress={() => handleItemPress(item)}
                  >
                    <View style={[styles.iconWrap, { width: iconWrapSize, height: iconWrapSize }]}>
                      <Image source={item.icon} style={[styles.icon, { width: iconSize, height: iconSize }]} resizeMode="contain" />
                    </View>
                    <Text style={styles.itemLabel}>{item.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ))}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#2E3F98',
  },
  container: {
    flex: 1,
    backgroundColor: '#31429B',
  },
  gradientOverlayTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '42%',
    backgroundColor: '#3A4AA2',
    opacity: 0.35,
  },
  gradientOverlayBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '38%',
    backgroundColor: '#31429B',
    opacity: 0.45,
  },
  scrollContent: {
    paddingTop: 18,
    paddingBottom: 24,
  },
  logo: {
    width: 188,
    height: 56,
    alignSelf: 'center',
    marginBottom: 16,
  },
  sectionCard: {
    backgroundColor: '#2C3B89',
    borderRadius: 20,
    paddingTop: 10,
    paddingBottom: 14,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 10,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  itemBtn: {
    alignItems: 'center',
  },
  iconWrap: {
    borderRadius: 21,
    backgroundColor: '#3248A2',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0D133D',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 5,
    elevation: 4,
    marginBottom: 8,
  },
  icon: {
    width: 54,
    height: 54,
  },
  itemLabel: {
    color: '#FFFFFF',
    fontSize: 13,
    lineHeight: 16,
    textAlign: 'center',
    fontWeight: '400',
    minHeight: 38,
  },
});

export default ExploreScreen;
