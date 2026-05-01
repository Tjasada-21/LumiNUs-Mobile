import React, { useMemo } from 'react';
import { Image, Pressable, ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import BrandHeader from '../components/BrandHeader';
import api from '../services/api';
import styles from '../styles/ViewPerkScreen.styles';

const formatValidUntil = (value) => {
	if (!value) {
		return 'No expiry date';
	}

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

const getPerkImageUris = (perk) => {
	const perkImages = Array.isArray(perk?.images)
		? perk.images
			.map((image) => image?.image_url || image?.url || image?.image_path || image?.path || null)
			.filter(Boolean)
		: [];

	if (perkImages.length > 0) {
		return perkImages;
	}

	return [perk?.image_url, perk?.image_path, perk?.image, perk?.photo].filter(Boolean).map((value) => String(value).trim());
};

const resolveImageUri = (value) => {
	if (!value) {
		return null;
	}

	const rawUri = String(value).trim();

	if (/^https?:\/\//i.test(rawUri) || rawUri.startsWith('data:') || rawUri.startsWith('file://')) {
		return rawUri;
	}

	const baseUrl = String(api.defaults.baseURL ?? '').replace(/\/api\/?$/, '').replace(/\/+$/, '');
	const normalizedPath = rawUri.replace(/^\/+/, '');

	return baseUrl ? `${baseUrl}/${normalizedPath}` : rawUri;
};

const ViewPerkScreen = ({ navigation, route }) => {
	const perk = route?.params?.perk ?? {};
	const imageUris = useMemo(() => getPerkImageUris(perk).map((value) => resolveImageUri(value)).filter(Boolean), [perk]);
	const heroImageUri = imageUris[0] ?? null;
	const galleryImageUris = imageUris.slice(1);

	return (
		<SafeAreaView style={styles.safeArea} edges={['top']}>
			<View style={styles.container}>
				<BrandHeader />

				<ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
					<View style={styles.heroCard}>
						<View style={styles.heroBadge}>
							<Ionicons name="pricetag-outline" size={16} color="#31429B" />
							<Text style={styles.heroBadgeText}>Perk details</Text>
						</View>

						{heroImageUri ? (
							<Image source={{ uri: heroImageUri }} style={styles.heroImage} resizeMode="cover" />
						) : (
							<View style={styles.heroPlaceholder}>
								<Ionicons name="pricetag-outline" size={44} color="#9CA3AF" />
								<Text style={styles.heroPlaceholderText}>No image available</Text>
							</View>
						)}

						<Text style={styles.title}>{perk.title || 'Untitled perk'}</Text>
						<Text style={styles.description}>{perk.description || 'No description available.'}</Text>

						{galleryImageUris.length > 0 ? (
							<View style={styles.gallerySection}>
								<Text style={styles.galleryLabel}>Attachments</Text>
								{galleryImageUris.length === 4 ? (
									<View style={styles.galleryGrid}>
										{galleryImageUris.map((imageUri, index) => (
											<View key={`${imageUri}-${index}`} style={styles.galleryGridItem}>
												<Image source={{ uri: imageUri }} style={styles.galleryGridImage} resizeMode="cover" />
											</View>
										))}
									</View>
								) : (
									<ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.galleryScroll}>
										{galleryImageUris.map((imageUri, index) => (
											<View key={`${imageUri}-${index}`} style={styles.galleryImageWrap}>
												<Image source={{ uri: imageUri }} style={styles.galleryImage} resizeMode="cover" />
											</View>
										))}
									</ScrollView>
								)}
							</View>
						) : null}

						<View style={styles.metaRow}>
							<View style={styles.metaPill}>
								<Ionicons name="calendar-outline" size={14} color="#31429B" />
								<Text style={styles.metaPillText}>Valid until {formatValidUntil(perk.valid_until)}</Text>
							</View>
						</View>
					</View>

					<Pressable style={styles.backButton} onPress={() => navigation.goBack()} accessibilityRole="button">
						<Ionicons name="arrow-back" size={18} color="#FFFFFF" />
						<Text style={styles.backButtonText}>Back to perks</Text>
					</Pressable>
				</ScrollView>
			</View>
		</SafeAreaView>
	);
};

export default ViewPerkScreen;
