import React, { useEffect, useState, useRef, useCallback } from 'react';
import { View, Text, FlatList, ActivityIndicator, Pressable, Modal, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import styles from '../styles/AlumniTracerScreen.styles';
import BrandHeader from '../components/BrandHeader';
import api from '../services/api';
import { getAuthToken } from '../services/authStorage';

const AlumniTracerScreen = () => {
	const [tracers, setTracers] = useState([]);
	const [loading, setLoading] = useState(true);
	const [refreshing, setRefreshing] = useState(false);
	const [columns, setColumns] = useState([]);
	const isMounted = useRef(true);
	const [selectedTracer, setSelectedTracer] = useState(null);
	const [modalVisible, setModalVisible] = useState(false);

	const fetchTracers = useCallback(async () => {
		try {
			// RN -> Laravel -> Supabase: mobile fetches from Laravel only.
			const token = await getAuthToken();
			const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
			const res = await api.get('/tracer-forms', { headers });
				const items = res.data?.tracer_forms ?? res.data?.tracers ?? res.data ?? [];
				const rows = Array.isArray(items) ? items : [];
				if (!isMounted.current) return;
				setTracers(rows);
				if (rows.length > 0) {
					const keys = Array.from(new Set(rows.flatMap(Object.keys)));
					const preferred = ['form_title', 'form_description', 'form_header', 'is_active', 'created_at', 'updated_at'];
					keys.sort((a, b) => {
						const ia = preferred.indexOf(a);
						const ib = preferred.indexOf(b);
						if (ia !== -1 || ib !== -1) return (ia === -1 ? 1 : ia) - (ib === -1 ? 1 : ib);
						return a.localeCompare(b);
					});
					setColumns(keys.filter(k => k != null));
				} else {
					setColumns([]);
				}
		} catch (e) {
			console.warn('Failed to load tracers', e?.message || e);
			if (!isMounted.current) return;
			setTracers([]);
		} finally {
			if (isMounted.current) setLoading(false);
		}
	}, []);

	useEffect(() => {
		isMounted.current = true;
		void fetchTracers();
		return () => { isMounted.current = false; };
	}, [fetchTracers]);

	const onRefresh = useCallback(async () => {
		setRefreshing(true);
		try {
			await fetchTracers();
		} finally {
			if (isMounted.current) setRefreshing(false);
		}
	}, [fetchTracers]);

	const openDetails = (item) => {
		setSelectedTracer(item);
		setModalVisible(true);
	};

	const renderItem = ({ item }) => {
		const name = `${item.first_name ?? ''} ${item.last_name ?? ''}`.trim();
		const initials = ((item.form_title?.[0] ?? '') + (item.form_title?.[1] ?? '')).toUpperCase();
		const title = (item.form_title ?? '').trim();
		const description = (item.form_description ?? '').trim();

		const displayCols = columns.length > 0
			? columns.filter(c => !['id', 'form_title', 'form_description'].includes(c))
			: Object.keys(item).filter(k => !['id', 'form_title', 'form_description'].includes(k));

		return (
			<Pressable style={styles.listItem} onPress={() => openDetails(item)}>
				<View style={styles.tracerAvatar}>
					<Text style={styles.tracerInitials}>{initials || 'A'}</Text>
				</View>
				<View style={styles.tracerInfo}>
					<Text style={styles.tracerName}>{title || name || 'Tracer Form'}</Text>
					{description ? (
						<Text style={styles.tracerMeta}>{description}</Text>
					) : (
						displayCols.slice(0, 3).map((k) => (
							<Text key={k} style={styles.tracerMeta}>{`${k.replace(/_/g, ' ')}: ${String(item[k] ?? '')}`}</Text>
						))
					)}
				</View>
			</Pressable>
		);
	};

	const renderDetails = () => {
		if (!selectedTracer) return null;
		const title = (selectedTracer.form_title ?? '').trim();
		const description = (selectedTracer.form_description ?? '').trim();
		const entries = (columns.length > 0 ? columns : Object.keys(selectedTracer)).filter(k => k !== 'id' && k !== 'form_description' && k !== 'form_title');
		return (
			<Modal
				visible={modalVisible}
				onRequestClose={() => setModalVisible(false)}
				animationType="slide"
				statusBarTranslucent={true}
			>
				<SafeAreaView style={styles.safeArea} edges={[ 'top' ]}>
					<View style={styles.container}>
						<View style={styles.modalContent}>
							<Text style={styles.modalHeader}>{title || 'Tracer Details'}</Text>
							<ScrollView style={styles.modalScroll}>
								{description ? (
									<Text style={styles.modalDescription}>{description}</Text>
								) : null}
								{entries.map((k) => (
									<View key={k} style={styles.modalField}>
										<Text style={styles.modalFieldKey}>{k.replace(/_/g, ' ')}</Text>
										<Text style={styles.modalFieldValue}>{String(selectedTracer[k] ?? '')}</Text>
									</View>
								))}
							</ScrollView>
							<Pressable style={styles.modalCloseButton} onPress={() => setModalVisible(false)}>
								<Text style={styles.modalCloseText}>Close</Text>
							</Pressable>
						</View>
					</View>
				</SafeAreaView>
			</Modal>
		);
	};

	return (
		<SafeAreaView style={styles.safeArea} edges={['top']}>
			<View style={styles.container}>
				<BrandHeader />
				<View style={styles.contentWrap}>
					<Text style={styles.title}>Alumni Tracer</Text>

					<View style={styles.listContainer}>
						{loading ? (
							<ActivityIndicator color="#31429B" />
						) : (
							<FlatList
								data={tracers}
								keyExtractor={(i) => String(i.id)}
								renderItem={renderItem}
								showsVerticalScrollIndicator={false}
								refreshing={refreshing}
								onRefresh={onRefresh}
								ListEmptyComponent={() => (
									<View style={styles.emptyState}>
										<Text style={styles.emptyText}>No tracer forms found.</Text>
									</View>
								)}
							/>
						)}
					</View>
				</View>
			</View>
			{renderDetails()}
		</SafeAreaView>
	);
};

export default AlumniTracerScreen;
