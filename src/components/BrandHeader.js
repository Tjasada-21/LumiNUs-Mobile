import React from 'react';
import { View, Text, StyleSheet, Image, useWindowDimensions, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { responsiveHeight, responsiveWidth } from '../utils/responsive';

const BrandHeader = () => {
  const navigation = useNavigation();
  const { width, height } = useWindowDimensions();
  const isCompactWidth = width < 375;
  const isTablet = width >= 768;

  const layout = {
    headerLogoWidth: responsiveWidth(width, 0.39, 160, isTablet ? 238 : 196),
    headerLogoHeight: responsiveHeight(height, 0.06, 40, 56),
    pillMinWidth: isTablet ? 132 : isCompactWidth ? 108 : 122,
  };

  return (
    <View style={styles.brandHeader}>
      <View style={styles.brandRow}>
        <Pressable
          onPress={() => navigation.navigate('Home', { screen: 'HomeTab' })}
          accessibilityRole="button"
          accessibilityLabel="Go to home screen"
          hitSlop={10}
        >
          <Image
            source={require('../../assets/images/lumi-n-us-logo-landscape-2.png')}
            style={[styles.brandLogo, { width: layout.headerLogoWidth, height: layout.headerLogoHeight }]}
            resizeMode="contain"
          />
        </Pressable>
        <View style={[styles.nulipaPill, { minWidth: layout.pillMinWidth }]}>
          <Image source={require('../../assets/images/nulogo.png')} style={styles.nulipaIcon} resizeMode="contain" />
          <Text style={styles.nulipaText}>NU LIPA</Text>
        </View>
      </View>
      <View style={styles.brandAccent} />
    </View>
  );
};

const styles = StyleSheet.create({
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
    width: 176,
    height: 56,
    marginLeft: -15,
  },
  nulipaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 7,
    justifyContent: 'center',
  },
  nulipaIcon: {
    width: 22,
    height: 22,
    marginRight: 6,
  },
  nulipaText: {
    color: '#31429B',
    fontWeight: '800',
    fontSize: 14,
    letterSpacing: 0.3,
  },
  brandAccent: {
    height: 10,
    backgroundColor: '#F2C919',
    width: '100%',
  },
});

export default BrandHeader;
