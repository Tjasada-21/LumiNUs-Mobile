import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';
import BrandHeader from '../components/BrandHeader';
import styles from '../styles/ConnectionsScreen.styles';
import { getAuthToken } from '../services/authStorage';

const ConnectionsScreen = ({ navigation }) => {
	const [connections, setConnections] = useState([]);
	const [loading, setLoading] = useState(true);
	const [errorMessage, setErrorMessage] = useState('');

	useEffect(() => {
		let isMounted = true;

		const fetchConnections = async () => {
			try {
				setLoading(true);
				setErrorMessage('');

				const token = await getAuthToken();

				if (!token) {
					setErrorMessage('No active session found.');
					return;
				}

				const response = await api.get('/contacts', {
					headers: { Authorization: `Bearer ${token}` },
				});

				if (!isMounted) {
					return;
				}

				setConnections(response.data?.contacts ?? []);
			} catch (fetchError) {
				console.error('Failed to fetch connections:', fetchError);
				if (isMounted) {
					setErrorMessage('Unable to load connections right now.');
				}
			} finally {
				if (isMounted) {
					setLoading(false);
				}
			}
		};

		fetchConnections();

		return () => {
			isMounted = false;
		};
	}, []);

	const openProfile = (userId) => {
		navigation.navigate('ProfileView', { userId });
	};

	return (
		<SafeAreaView style={styles.safeArea} edges={['top']}>
			<View style={styles.container}>
				<BrandHeader />
				<ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
					<View style={styles.headerCard}>
						<Text style={styles.title}>Connections</Text>
						<Text style={styles.subtitle}>Accepted connections show up here and can be opened as chat contacts.</Text>
					</View>

					{loading ? (
						<View style={styles.loadingWrap}>
							<ActivityIndicator color="#31429B" />
						</View>
					) : errorMessage ? (
						<View style={styles.emptyCard}>
							<Text style={styles.emptyTitle}>{errorMessage}</Text>
						</View>
					) : connections.length === 0 ? (
						<View style={styles.emptyCard}>
							<Text style={styles.emptyTitle}>No connections yet.</Text>
							<Text style={styles.emptyText}>Accepted requests will appear here.</Text>
						</View>
					) : (
						<View style={styles.contactList}>
							{connections.map((contact) => {
								const contactName = `${contact.first_name ?? ''} ${contact.last_name ?? ''}`.trim() || 'Alumni';
								const contactAvatar = contact.alumni_photo
									? contact.alumni_photo
									: `https://ui-avatars.com/api/?name=${encodeURIComponent(contactName)}&background=31429B&color=fff`;

								return (
									<TouchableOpacity
										key={String(contact.connection_id ?? contact.id)}
										style={styles.contactCard}
										activeOpacity={0.85}
										onPress={() => openProfile(contact.id)}
									>
										<Image source={{ uri: contactAvatar }} style={styles.contactAvatar} />
										<View style={styles.contactTextWrap}>
											<Text style={styles.contactName} numberOfLines={1}>{contactName}</Text>
											<Text style={styles.contactMeta}>Connected</Text>
										</View>
										<Ionicons name="chevron-forward" size={18} color="#8A94A6" />
									</TouchableOpacity>
								);
							})}
						</View>
					)}
				</ScrollView>
			</View>
		</SafeAreaView>
	);
};

export default ConnectionsScreen;