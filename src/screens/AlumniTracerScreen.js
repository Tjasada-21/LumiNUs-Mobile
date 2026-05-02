import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import {
	View,
	Text,
	FlatList,
	ActivityIndicator,
	Pressable,
	Modal,
	ScrollView,
	RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import styles from '../styles/AlumniTracerScreen.styles';
import BrandHeader from '../components/BrandHeader';
import api from '../services/api';
import { getAuthToken } from '../services/authStorage';

// Fast data extraction from various response formats
const extractTracers = (response) => {
	const d = response?.data;
	if (Array.isArray(d?.tracer_forms)) return d.tracer_forms;
	if (Array.isArray(d?.data?.tracer_forms)) return d.data.tracer_forms;
	if (Array.isArray(d?.data)) return d.data;
	return Array.isArray(d) ? d : [];
};

// Format date to readable format
const formatDate = (dateStr) => {
	if (!dateStr) return '';
	try {
		const date = new Date(dateStr);
		return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
	} catch {
		return dateStr;
	}
};

// Utility functions - inline for speed
const getTitle = (i) => i?.form_title || i?.title || i?.name || 'Form';
const getDesc = (i) => i?.form_description || i?.description || '';
const getHdr = (i) => i?.form_header || i?.header || '';
const getStatus = (i) => {
	const s = i?.status ?? i?.is_active;
	return s === undefined ? 'Inactive' : String(s) === '1' || String(s).toLowerCase() === 'active' ? 'Active' : 'Inactive';
};
const fmtKey = (k) => String(k).replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
const fmtVal = (v) => {
	if (v === null || v === undefined || v === '') return '—';
	if (typeof v === 'boolean') return v ? 'Yes' : 'No';
	if (String(v).includes('-') && String(v).includes(':')) return formatDate(v); // Date format
	return String(v);
};

// Memoized list item
const TracerItem = React.memo(({ item, onPress }) => {
	const title = getTitle(item);
	const isActive = getStatus(item) === 'Active';
	return (
		<Pressable style={styles.listItem} onPress={() => onPress(item)}>
			<View style={styles.tracerAvatar}>
				<Text style={styles.tracerInitials}>{title.slice(0, 2).toUpperCase()}</Text>
			</View>
			<View style={styles.tracerInfo}>
				<Text style={styles.tracerName}>{title}</Text>
				<View style={[styles.statusBadge, isActive ? styles.statusBadgeActive : styles.statusBadgeInactive]}>
					<Text style={[styles.statusBadgeText, isActive ? styles.statusBadgeTextActive : styles.statusBadgeTextInactive]}>
						Status: {isActive ? 'Active' : 'Inactive'}
					</Text>
				</View>
				{getHdr(item) ? <Text style={styles.tracerMeta}>{getHdr(item)}</Text> : null}
				{getDesc(item) ? <Text style={styles.tracerMeta} numberOfLines={2}>{getDesc(item)}</Text> : null}
				{item?.created_at ? <Text style={styles.tracerMeta}>Created: {formatDate(item.created_at)}</Text> : null}
			</View>
		</Pressable>
	);
});
TracerItem.displayName = 'TracerItem';

// Main screen
const AlumniTracerScreen = () => {
	const [tracers, setTracers] = useState([]);
	const [loading, setLoading] = useState(true);
	const [refreshing, setRefreshing] = useState(false);
	const [error, setError] = useState('');
	const [selectedTracer, setSelectedTracer] = useState(null);
	const [modalVisible, setModalVisible] = useState(false);
	const isMounted = useRef(true);

	const fetchTracers = useCallback(async () => {
		try {
			setLoading(true);
			setError('');

			const token = await getAuthToken();
			if (!token) {
				setError('No active session.');
				return;
			}

			const res = await api.get('/tracer-forms', {
				headers: { Authorization: `Bearer ${token}` },
				timeout: 8000,
			});

			const data = extractTracers(res);
			if (isMounted.current) setTracers(data);
		} catch (err) {
			if (!isMounted.current) return;
			const msg = err?.response?.data?.message || err?.message || 'Failed to load';
			const status = err?.response?.status;
			setError(status ? `${status}: ${msg}` : msg);
			setTracers([]);
		} finally {
			if (isMounted.current) setLoading(false);
		}
	}, []);

	useEffect(() => {
		isMounted.current = true;
		fetchTracers();
		return () => {
			isMounted.current = false;
		};
	}, [fetchTracers]);

	const handleRefresh = useCallback(async () => {
		setRefreshing(true);
		try {
			await fetchTracers();
		} finally {
			if (isMounted.current) setRefreshing(false);
		}
	}, [fetchTracers]);

	const openDetails = useCallback((item) => {
		setSelectedTracer(item);
		setModalVisible(true);
	}, []);

	const closeModal = useCallback(() => setModalVisible(false), []);

	const renderItem = useCallback(({ item }) => <TracerItem item={item} onPress={openDetails} />, [openDetails]);

	const detailsModal = useMemo(() => {
		if (!selectedTracer) return null;
		const title = getTitle(selectedTracer);
		const entries = Object.entries(selectedTracer).filter(
			([k]) => !['id', 'form_id', 'form_title', 'title', 'name', 'form_description', 'description', 'form_header', 'header', 'status', 'is_active'].includes(k)
		);

		return (
			<Modal visible={modalVisible} onRequestClose={closeModal} animationType="slide" statusBarTranslucent>
				<SafeAreaView style={styles.safeArea} edges={['top']}>
					<View style={styles.container}>
						<View style={styles.modalContent}>
							<Text style={styles.modalHeader}>{title}</Text>
							<ScrollView style={styles.modalScroll}>
								{getDesc(selectedTracer) ? <Text style={styles.modalDescription}>{getDesc(selectedTracer)}</Text> : null}
								<View style={styles.modalField}>
									<Text style={styles.modalFieldKey}>Status</Text>
									<Text style={styles.modalFieldValue}>{getStatus(selectedTracer)}</Text>
								</View>
								{entries.map(([k, v]) => (
									<View key={k} style={styles.modalField}>
										<Text style={styles.modalFieldKey}>{fmtKey(k)}</Text>
										<Text style={styles.modalFieldValue}>{fmtVal(v)}</Text>
									</View>
								))}
							</ScrollView>
							<Pressable style={styles.modalCloseButton} onPress={closeModal}>
								<Text style={styles.modalCloseText}>Close</Text>
							</Pressable>
						</View>
					</View>
				</SafeAreaView>
			</Modal>
		);
	}, [selectedTracer, modalVisible, closeModal]);

	const emptyList = useMemo(
		() => (
			<View style={styles.emptyState}>
				{error ? <Text style={styles.emptyText}>{error}</Text> : null}
				<Text style={styles.emptyText}>No tracer forms found.</Text>
			</View>
		),
		[error]
	);

	return (
		<SafeAreaView style={styles.safeArea} edges={['top']}>
			<View style={styles.container}>
				<BrandHeader />
				<View style={styles.contentWrap}>
					<Text style={styles.title}>Alumni Tracer</Text>
					<View style={styles.listContainer}>
						<FlatList
							data={tracers}
							keyExtractor={(item) => String(item?.id || item?.form_id || Math.random())}
							renderItem={renderItem}
							showsVerticalScrollIndicator={false}
							maxToRenderPerBatch={15}
							updateCellsBatchingPeriod={50}
							initialNumToRender={15}
							removeClippedSubviews={true}
							refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={['#31429B']} tintColor="#31429B" />}
							ListEmptyComponent={emptyList}
							scrollEnabled={true}
						/>
					</View>
				</View>
			</View>
			{detailsModal}
		</SafeAreaView>
	);
};

export default AlumniTracerScreen;
