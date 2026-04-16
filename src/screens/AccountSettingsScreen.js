import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, ActivityIndicator, Alert, Platform } from 'react-native';
import SmartTextInput from '../components/SmartTextInput';
import * as ImagePicker from 'expo-image-picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import api from '../services/api';

const formatDate = (value) => {
  if (!value) return '—';

  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) {
    return String(value);
  }

  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(parsedDate);
};

const AccountSettingsScreen = ({ navigation }) => {
  const [userData, setUserData] = useState(null);
  const [formData, setFormData] = useState({
    first_name: '',
    middle_name: '',
    last_name: '',
    phone_number: '',
    email: '',
    date_of_birth: '',
    sex: '',
    alumni_photo: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [pickingImage, setPickingImage] = useState(false);

  useEffect(() => {
    const fetchAccountData = async () => {
      try {
        setLoading(true);
        setErrorMessage('');

        const userEmail = await SecureStore.getItemAsync('userEmail');

        if (!userEmail) {
          setErrorMessage('No account email is stored for this session.');
          return;
        }

        const response = await api.get('/alumni/profile');
        const data = response.data?.alumni ?? null;

        setUserData(data);
        setFormData({
          first_name: data?.first_name || '',
          middle_name: data?.middle_name || '',
          last_name: data?.last_name || '',
          phone_number: data?.phone_number || '',
          email: data?.email || userEmail,
          date_of_birth: data?.date_of_birth ? String(data.date_of_birth).slice(0, 10) : '',
          sex: data?.sex || '',
          alumni_photo: data?.alumni_photo || '',
        });
      } catch (fetchError) {
        console.error('Failed to fetch account settings:', fetchError);
        setErrorMessage('Unable to load account details right now.');
      } finally {
        setLoading(false);
      }
    };

    fetchAccountData();
  }, []);

  const updateField = (field, value) => {
    setFormData((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const uploadImage = async (uri) => {
    try {
      const filename = uri.split('/').pop();
      const match = /\.(\w+)$/.exec(filename);
      const ext = match ? match[1].toLowerCase() : 'jpg';
      const mimeType = ext === 'png' ? 'image/png' : 'image/jpeg';

      const formData = new FormData();
      formData.append('photo', {
        uri,
        name: filename,
        type: mimeType,
      });

      const resp = await api.post('/alumni/photo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const uploadedUrl = resp.data?.url;
      if (!uploadedUrl) throw new Error('No url returned from upload');
      return uploadedUrl;
    } catch (err) {
      throw err;
    }
  };
  const handleSave = async () => {
    if (!userData?.email) {
      setErrorMessage('Missing the current account email.');
      return;
    }

    const fields = ['first_name', 'middle_name', 'last_name', 'phone_number', 'email', 'date_of_birth', 'sex', 'alumni_photo'];

    const getChangedPayload = () => {
      const changes = {};
      fields.forEach((f) => {
        const newVal = (formData[f] ?? '').trim();
        const oldValRaw = userData?.[f];
        const oldVal = oldValRaw == null ? '' : String(oldValRaw).slice(0, 10);

        // for date_of_birth we normalized to YYYY-MM-DD elsewhere; compare slices
        if (f === 'date_of_birth') {
          const oldDate = userData?.date_of_birth ? String(userData.date_of_birth).slice(0, 10) : '';
          if (newVal !== oldDate) changes[f] = newVal;
        } else {
          if (newVal !== (oldValRaw ?? '')) changes[f] = newVal;
        }
      });
      return changes;
    };

    const changes = getChangedPayload();

    if (Object.keys(changes).length === 0) {
      Alert.alert('No changes', 'You have not modified any fields.');
      return;
    }

    const fieldLabels = {
      first_name: 'First Name',
      middle_name: 'Middle Name',
      last_name: 'Last Name',
      phone_number: 'Mobile Number',
      email: 'Email',
      date_of_birth: 'Date of Birth',
      sex: 'Gender',
      alumni_photo: 'Profile Photo URL',
    };

    const changedNames = Object.keys(changes).map((k) => fieldLabels[k] || k).join(', ');

    Alert.alert(
      'Confirm Save',
      `Save changes to: ${changedNames}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Save',
          onPress: async () => {
            try {
              setSaving(true);
              setErrorMessage('');

              const response = await api.put('/alumni/profile', changes);
              const data = response.data?.alumni ?? null;

              if (data) {
                setUserData(data);
                setFormData({
                  first_name: data.first_name || '',
                  middle_name: data.middle_name || '',
                  last_name: data.last_name || '',
                  phone_number: data.phone_number || '',
                  email: data.email || '',
                  date_of_birth: data.date_of_birth ? String(data.date_of_birth).slice(0, 10) : '',
                  sex: data.sex || '',
                  alumni_photo: data.alumni_photo || '',
                });
                await SecureStore.setItemAsync('userEmail', data.email);
              }

              Alert.alert('Saved', 'Your account details were updated successfully.');
            } catch (saveError) {
              console.error('Failed to save account settings:', saveError);
              setErrorMessage('Unable to save account details right now.');
            } finally {
              setSaving(false);
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  const profileName = userData
    ? [formData.first_name, formData.middle_name, formData.last_name].filter(Boolean).join(' ')
    : 'Alumni';

  const profileImageUri = formData.alumni_photo
    ? formData.alumni_photo
    : `https://ui-avatars.com/api/?name=${encodeURIComponent(profileName)}&background=1E293B&color=fff&size=256`;

  const verificationStatus = userData?.verification_status || 'pending';
  const phoneStatusText = verificationStatus === 'verified' ? 'Verified' : 'Unverified';
  const emailActionText = verificationStatus === 'verified' ? 'Verified' : 'Verify Email';
  const formDisabled = loading || saving;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Image
            source={require('../../assets/images/lumi-n-us-logo-landscape-2.png')}
            style={styles.headerLogo}
            resizeMode="contain"
          />
          <View style={styles.badgeContainer}>
            <Image source={require('../../assets/images/nulogo.png')} style={styles.badgeIcon} />
            <Text style={styles.badgeText}>NU LIPA</Text>
          </View>
        </View>

        <View style={styles.headerAccent} />

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          <TouchableOpacity style={styles.homeButton} activeOpacity={0.8} onPress={() => navigation.navigate('Home')}>
            <Ionicons name="home-outline" size={24} color="#31429B" />
          </TouchableOpacity>

          <View style={styles.profileWrap}>
            <Image source={{ uri: profileImageUri }} style={styles.profileImage} />
            <TouchableOpacity
              style={styles.editAvatarButton}
              activeOpacity={0.8}
              onPress={async () => {
                try {
                  setPickingImage(true);
                  const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
                  if (permissionResult.status !== 'granted') {
                    Alert.alert('Permission required', 'Permission to access photos is required to choose a profile image.');
                    return;
                  }

                  const result = await ImagePicker.launchImageLibraryAsync({
                    mediaTypes: ImagePicker.MediaTypeOptions.Images,
                    allowsEditing: false, // disable crop-only UI so user can pick freely
                    quality: 0.8,
                  });

                  const selectedUri = result.uri ?? result.assets?.[0]?.uri;

                  if (selectedUri) {
                    try {
                      // upload immediately and use hosted URL as preview
                      const hostedUrl = await uploadImage(selectedUri);
                      updateField('alumni_photo', hostedUrl);
                      Alert.alert('Uploaded', 'Profile photo uploaded.');
                    } catch (uploadErr) {
                      console.error('Upload failed:', uploadErr);
                      // fallback to local uri preview and inform user
                      updateField('alumni_photo', selectedUri);
                      Alert.alert('Upload failed', 'Image upload failed — using local preview. You can try saving again.');
                    }
                  }
                } catch (err) {
                  console.error('Image pick failed:', err);
                  Alert.alert('Error', 'Unable to pick image.');
                } finally {
                  setPickingImage(false);
                }
              }}
            >
              {pickingImage ? (
                <ActivityIndicator color="#31429B" />
              ) : (
                <Ionicons name="pencil" size={16} color="#31429B" />
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.formCard}>
            <Text style={styles.sectionHeading}>User Information</Text>

            <View style={styles.inputBlockCompact}>
              <Text style={styles.inputLabel}>Last Name</Text>
              <SmartTextInput
                value={formData.last_name}
                onChangeText={(value) => updateField('last_name', value)}
                placeholder="Last name"
                placeholderTextColor="#9A9A9A"
                style={styles.inputValue}
                editable={!formDisabled}
              />
            </View>

            <View style={styles.inputBlockCompact}>
              <Text style={styles.inputLabel}>First Name</Text>
              <SmartTextInput
                value={formData.first_name}
                onChangeText={(value) => updateField('first_name', value)}
                placeholder="First name"
                placeholderTextColor="#9A9A9A"
                style={styles.inputValue}
                editable={!formDisabled}
              />
            </View>

            <View style={styles.inputBlockCompact}>
              <Text style={styles.inputLabel}>Middle Name</Text>
              <SmartTextInput
                value={formData.middle_name}
                onChangeText={(value) => updateField('middle_name', value)}
                placeholder="Middle name"
                placeholderTextColor="#9A9A9A"
                style={styles.inputValue}
                editable={!formDisabled}
              />
            </View>

            <Text style={[styles.sectionHeading, styles.sectionHeadingSpacing]}>Personal Details</Text>

            <View style={styles.inputBlockCompact}>
              <Text style={styles.inputLabel}>Mobile Number</Text>
              <View style={styles.inlineRow}>
                <SmartTextInput
                  value={formData.phone_number}
                  onChangeText={(value) => updateField('phone_number', value)}
                  placeholder="Mobile number"
                  placeholderTextColor="#9A9A9A"
                  style={[styles.inputValue, styles.inputGrow]}
                  keyboardType="phone-pad"
                  editable={!formDisabled}
                />
                <Text style={styles.verifiedText}>{phoneStatusText}</Text>
              </View>
            </View>

            <View style={styles.inputBlockCompact}>
              <Text style={styles.inputLabel}>Personal Email Address</Text>
              <View style={styles.inlineRow}>
                <SmartTextInput
                  value={formData.email}
                  onChangeText={(value) => updateField('email', value)}
                  placeholder="Personal email address"
                  placeholderTextColor="#9A9A9A"
                  style={[styles.inputValue, styles.inputEmailValue]}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  numberOfLines={1}
                  editable={!formDisabled}
                />
                <TouchableOpacity activeOpacity={0.8} style={styles.verifyLinkButton}>
                  <Text style={styles.verifyLink}>{emailActionText}</Text>
                </TouchableOpacity>
              </View>
            </View>

            <Text style={styles.helpText}>
              Your Personal Email Address will be used for One Time Passwords.
            </Text>

            <View style={styles.twoColRow}>
              <View style={[styles.inputBlock, styles.halfInput]}>
                <Text style={styles.inputLabel}>Date of Birth</Text>
                <View style={styles.dateInputRow}>
                  <Ionicons name="calendar-outline" size={16} color="#666" />
                  <SmartTextInput
                    value={formData.date_of_birth}
                    onChangeText={(value) => updateField('date_of_birth', value)}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor="#9A9A9A"
                    style={[styles.inputValue, styles.dateValue]}
                    editable={!formDisabled}
                  />
                </View>
              </View>

              <View style={[styles.inputBlock, styles.halfInput]}>
                <Text style={styles.inputLabel}>Gender</Text>
                <View style={styles.genderInputRow}>
                  <TouchableOpacity
                    style={styles.genderSelect}
                    activeOpacity={0.8}
                    disabled={formDisabled}
                    onPress={() => {
                      const options = [
                        { text: 'Male', onPress: () => updateField('sex', 'male') },
                        { text: 'Female', onPress: () => updateField('sex', 'female') },
                        { text: 'Non-binary', onPress: () => updateField('sex', 'non-binary') },
                        { text: 'Prefer not to say', onPress: () => updateField('sex', '') },
                        { text: 'Cancel', style: 'cancel' },
                      ];

                      if (Platform.OS === 'ios') {
                        // Action sheet-like on iOS
                        Alert.alert('Select Gender', undefined, options, { cancelable: true });
                      } else {
                        // Android: use same alert with buttons
                        Alert.alert('Select Gender', undefined, options, { cancelable: true });
                      }
                    }}
                  >
                    <Text style={[styles.inputValue, styles.dateValue]}>
                      {formData.sex ? String(formData.sex) : 'Gender'}
                    </Text>
                    <Ionicons name="chevron-down-circle-outline" size={18} color="#666" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Profile Photo URL field removed */}
          </View>

          {loading ? (
            <Text style={styles.loadingText}>Loading your current profile data...</Text>
          ) : null}

          {loading ? (
            <View style={styles.loadingWrap}>
              <ActivityIndicator color="#31429B" />
            </View>
          ) : null}

          {!!errorMessage && !loading ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

          <TouchableOpacity style={styles.saveButton} activeOpacity={0.9} onPress={handleSave} disabled={formDisabled}>
            {saving ? (
              <ActivityIndicator color="#31429B" />
            ) : (
              <Text style={styles.saveButtonText}>Save Profile Information</Text>
            )}
          </TouchableOpacity>



          <TouchableOpacity style={styles.resetButton} activeOpacity={0.9}>
            <Text style={styles.resetButtonText}>Reset Account Password</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#31429B',
  },
  container: {
    flex: 1,
    backgroundColor: '#ECECEC',
  },
  header: {
    backgroundColor: '#31429B',
    paddingHorizontal: 20,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLogo: {
    width: 146,
    height: 36,
  },
  badgeContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingVertical: 7,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  badgeIcon: {
    width: 17,
    height: 17,
    marginRight: 6,
  },
  badgeText: {
    color: '#2D3F9E',
    fontWeight: '800',
    fontSize: 12,
  },
  headerAccent: {
    height: 11,
    backgroundColor: '#F2C919',
  },
  scrollContent: {
    paddingHorizontal: 22,
    paddingBottom: 28,
  },
  homeButton: {
    alignSelf: 'flex-end',
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#F2C919',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    marginBottom: 4,
  },
  profileWrap: {
    alignSelf: 'center',
    marginTop: '1%',
    marginBottom: 16,
    position: 'relative',
  },
  profileImage: {
    width: 126,
    height: 126,
    borderRadius: 63,
    borderWidth: 2,
    borderColor: '#EEE',
  },
  editAvatarButton: {
    position: 'absolute',
    right: 2,
    bottom: 2,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#F2C919',
    alignItems: 'center',
    justifyContent: 'center',
  },
  formCard: {
    backgroundColor: '#E4E4E4',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  sectionHeading: {
    color: '#3F3F3F',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 10,
  },
  sectionHeadingSpacing: {
    marginTop: 6,
  },
  inputBlock: {
    backgroundColor: '#EFEFEF',
    borderWidth: 1,
    borderColor: '#B9B9B9',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    marginBottom: 10,
  },
  inputBlockCompact: {
    backgroundColor: '#EFEFEF',
    borderWidth: 1,
    borderColor: '#B9B9B9',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 1,
    marginBottom: 8,
  },
  inputLabel: {
    color: '#5C5C5C',
    fontSize: 10,
    marginBottom: 1,
  },
  inputValue: {
    color: '#333333',
    fontSize: 14,
  },
  inputGrow: {
    flex: 1,
  },
  inlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  inputEmailValue: {
    flex: 1,
  },
  genderSelect: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flex: 1,
  },
  verifyLinkButton: {
    marginLeft: 8,
    flexShrink: 0,
  },
  verifiedText: {
    color: '#2F9B3D',
    fontSize: 10,
    fontStyle: 'italic',
    fontWeight: '600',
  },
  verifyLink: {
    color: '#31429B',
    fontSize: 10,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  helpText: {
    color: '#777777',
    fontSize: 8,
    fontStyle: 'italic',
    marginBottom: 10,
  },
  twoColRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfInput: {
    width: '48.5%',
    marginBottom: 0,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  dateInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginTop: 4,
    paddingVertical: 0,
  },
  genderInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginTop: 4,
    paddingVertical: 0,
  },
  dateValue: {
    flex: 1,
    marginLeft: 10,
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 14,
    paddingVertical: 0,
  },
  loadingWrap: {
    paddingTop: 16,
  },
  loadingText: {
    color: '#31429B',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 14,
    textAlign: 'center',
  },
  errorText: {
    color: '#B91C1C',
    fontSize: 12,
    marginTop: 12,
  },
  saveButton: {
    backgroundColor: '#F2C919',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    marginTop: 22,
  },
  saveButtonText: {
    color: '#31429B',
    fontSize: 12,
    fontWeight: '700',
  },
  resetButton: {
    backgroundColor: '#31429B',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    marginTop: 14,
  },
  resetButtonText: {
    color: '#F2C919',
    fontSize: 12,
    fontWeight: '700',
  },
});

export default AccountSettingsScreen;
