import React, { useEffect, useState } from 'react';
import { View, Text, Image, TouchableOpacity, ScrollView, ActivityIndicator, useWindowDimensions } from 'react-native';
import SmartTextInput from '../components/SmartTextInput';
import * as ImagePicker from 'expo-image-picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';
import BrandHeader from '../components/BrandHeader';
import styles from '../styles/AccountSettingsScreen.styles';
import { getAuthEmail, getAuthToken, isRememberedSession, setAuthCredentials } from '../services/authStorage';
import { showBrandedAlert } from '../services/brandedAlert';

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
  // SECTION: Screen layout values
  const { width } = useWindowDimensions();
  const isCompactWidth = width < 390;
  const isTablet = width >= 768;
  const layout = {
    headerLogoWidth: isTablet ? 176 : isCompactWidth ? 124 : 146,
    headerLogoHeight: isTablet ? 48 : isCompactWidth ? 32 : 36,
    profileSize: isTablet ? 144 : isCompactWidth ? 110 : 126,
    cardPadding: isCompactWidth ? 14 : 16,
  };

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

  // SECTION: Load account data
  useEffect(() => {
    const fetchAccountData = async () => {
      try {
        setLoading(true);
        setErrorMessage('');

        const userEmail = await getAuthEmail();

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

  // HANDLER: Update a single form field
  const updateField = (field, value) => {
    setFormData((current) => ({
      ...current,
      [field]: value,
    }));
  };

  // HANDLER: Upload a selected profile image
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

  // HANDLER: Save the profile changes
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
      showBrandedAlert('No changes', 'You have not modified any fields.');
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

    showBrandedAlert(
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

                await setAuthCredentials({
                  token: await getAuthToken(),
                  email: data.email,
                  remember: isRememberedSession(),
                });
              }

              showBrandedAlert('Saved', 'Your account details were updated successfully.');
            } catch (saveError) {
              console.error('Failed to save account settings:', saveError);
              const serverData = saveError.response?.data;
              let friendly = 'Unable to save account details right now.';

              if (serverData?.errors) {
                const firstKey = Object.keys(serverData.errors)[0];
                friendly = serverData.errors[firstKey]?.[0] || friendly;
              } else if (serverData?.message) {
                friendly = serverData.message;
              }

              setErrorMessage(friendly);
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
        <BrandHeader />

        {/* SECTION: Account form */}
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {/* SECTION: Home shortcut */}
          <TouchableOpacity style={styles.homeButton} activeOpacity={0.8} onPress={() => navigation.navigate('Home')}>
            <Ionicons name="home-outline" size={24} color="#31429B" />
          </TouchableOpacity>

          {/* SECTION: Profile photo */}
          <View style={styles.profileWrap}>
            <Image source={{ uri: profileImageUri }} style={[styles.profileImage, { width: layout.profileSize, height: layout.profileSize, borderRadius: layout.profileSize / 2 }]} />
            <TouchableOpacity
              style={styles.editAvatarButton}
              activeOpacity={0.8}
              onPress={async () => {
                try {
                  setPickingImage(true);
                  const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
                  if (permissionResult.status !== 'granted') {
                    showBrandedAlert('Permission required', 'Permission to access photos is required to choose a profile image.');
                    return;
                  }

                  const result = await ImagePicker.launchImageLibraryAsync({
                    mediaTypes: ['images'],
                    allowsEditing: false, // disable crop-only UI so user can pick freely
                    quality: 0.8,
                  });

                  const selectedUri = result.uri ?? result.assets?.[0]?.uri;

                  if (selectedUri) {
                    try {
                      // upload immediately and use hosted URL as preview
                      const hostedUrl = await uploadImage(selectedUri);
                      updateField('alumni_photo', hostedUrl);
                      showBrandedAlert('Uploaded', 'Profile photo uploaded.');
                    } catch (uploadErr) {
                      console.error('Upload failed:', uploadErr);
                      // fallback to local uri preview and inform user
                      updateField('alumni_photo', selectedUri);
                      showBrandedAlert('Upload failed', 'Image upload failed — using local preview. You can try saving again.');
                    }
                  }
                } catch (err) {
                  console.error('Image pick failed:', err);
                  showBrandedAlert('Error', 'Unable to pick image.');
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

          {/* SECTION: User information */}
          <View style={[styles.formCard, { paddingHorizontal: layout.cardPadding, paddingVertical: layout.cardPadding }]}>
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

            {/* SECTION: Personal details */}
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

            <View style={[styles.twoColRow, isCompactWidth && styles.twoColRowStacked]}>
              <View style={[styles.inputBlock, styles.halfInput, isCompactWidth && styles.fullWidthInput]}>
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

              <View style={[styles.inputBlock, styles.halfInput, isCompactWidth && styles.fullWidthInput]}>
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

                      showBrandedAlert('Select Gender', '', options, { cancelable: true });
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

          {/* SECTION: Save state and actions */}
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



          <TouchableOpacity
            style={styles.resetButton}
            activeOpacity={0.9}
            onPress={() => navigation.navigate('ResetPassword', { student_id_number: userData?.student_id_number || '' })}
          >
            <Text style={styles.resetButtonText}>Reset Account Password</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

export default AccountSettingsScreen;
