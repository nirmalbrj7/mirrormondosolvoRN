import React, { useEffect, useState } from 'react';
import { View, ScrollView, PermissionsAndroid, Text, Alert, FlatList } from 'react-native';
import { useSafeArea } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';
import PropTypes from 'prop-types';
import globalStyles from '../../globalStyles';
import FormFlowWizard from '../../components/Form';
import { connect } from 'react-redux';

import StoreActionsForm from '../../store/actions/form';
import StoreActionsSubmission from '../../store/actions/submission';
import GetLocation from 'react-native-get-location'
import Geolocation from '@react-native-community/geolocation';
import { Button } from 'react-native-paper';
import SystemSetting from 'react-native-system-setting';

import RNFetchBlob from 'rn-fetch-blob'
import {
	Placeholder,
	PlaceholderMedia,
	PlaceholderLine,
	Fade,
	Loader,
	Shine,
	ShineOverlay,
} from 'rn-placeholder';
import { Card, } from 'react-native-paper';
const DATA = [
	{
		id: 'bd7acbea-c1b1-46c2-aed5-3ad53abb28ba',
		title: 'First Item',
	},
	{
		id: '3ac68afc-c605-48d3-a4f8-fbd91aa97f63',
		title: 'Second Item',
	},
	{
		id: '58694a0f-3da1-471f-bd96-145571e29d72',
		title: 'Third Item',
	},
];

class FormView extends React.Component {
	constructor(props, navigation, route) {
		super(props);
		const params = this.props.route.params;
		const payload = params.payload;

		this.state = {
			loading: false,
			payload: payload,
			formName: params.formName,
			latitude: 0,
			longitude: 0,
			isLargeForm: payload.isLargeForm,
			formSlug: payload.slug,
			formCreated: payload.DateCreated
		};
		this.props.navigation.setOptions({ headerTitle: params.formName });
	}


	getGeolocationCom = async () => {
		const _this = this;

		const {
			tryUpdateCurrentForm,
			setCurrentFormData,
			initializeSubmission,
			allsubmission
		} = _this.props;
		// initializeSubmission(null, 'aaa', 'aaaa');
		SystemSetting.isLocationEnabled().then((enable) => {
			const state = enable ? 'On' : 'Off';
			console.log('Current location is ' + state);
		})
		try {
			const granted = await PermissionsAndroid.request(
				PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
				{
					title: "BC Forms Permission",
					message:
						"BC Forms App needs access to your location " +
						"so you can take address.",
					buttonNeutral: "Ask Me Later",
					buttonNegative: "Cancel",
					buttonPositive: "OK"
				}
			);
			if (granted === PermissionsAndroid.RESULTS.GRANTED) {
				//initializeSubmission(null, 'bbb', 'bbb');
				//console.log("You can use the camera");
				GetLocation.getCurrentPosition({
					enableHighAccuracy: true,
					timeout: 15000,
				})
					.then(location => {
						// initializeSubmission(null, location.latitude, location.longitude);
						console.log(location);
					})
					.catch(error => {
						const { code, message } = error;
						console.warn("aaa" + code + message);
					})


			} else {
				console.log("Camera permission denied");
			}
		} catch (err) {
			console.warn(JSON.stringify(err));
		}


	};
	componentDidMount = async () => {
		if (this.state.isLargeForm == 'true') {
			//  await this.getGeolocationCom()
			await this.handleFormsListItemPressForDownload();
		}
		else {
			//s await this.getGeolocationCom()
			await this.handleFormsListItemPress();
		}

	}
	getGeolocation = async () => {

		GetLocation.getCurrentPosition({
			enableHighAccuracy: true,
			timeout: 15000,
		})
			.then(async location => {
				console.log(location);
				//   await this.handleFormsListItemPress(location)

			})
			.catch(error => {
				const { code, message } = error;
				console.warn(code, message);
			})
	}

	handleFormsListItemPress = async () => {
		const { form, formEndpoint, datagrid, slug } = this.state.payload.doc.data();
		console.log("fff" + form);
		var load2 = this.state.loading == true ? 'true' : 'false';
		const {
			tryUpdateCurrentForm,
			setCurrentFormData,
			initializeSubmission,
		} = this.props;

		tryUpdateCurrentForm({ form, formEndpoint });;
		setCurrentFormData(this.state.payload.name, this.state.payload.doc.id, datagrid, slug);
		this.setState({
			loading: true
		})
		var load = this.state.loading == true ? 'true' : 'false';
	};
	handleFormsListItemPressForDownload = async () => {

		const { dirs } = RNFetchBlob.fs;
		const { formSlug, formCreated } = this.state;
		const path = `${dirs.DownloadDir}/bcforms/${formSlug}_${formCreated.seconds}.json`;
	
		await RNFetchBlob.fs.readFile(path, 'utf-8')
			.then((data) => {


				if (data != null && data != undefined) {

					const { formEndpoint, datagrid, slug } = this.state.payload.doc.data();

					var load2 = this.state.loading == true ? 'true' : 'false';
					const {
						tryUpdateCurrentForm,
						setCurrentFormData,
						initializeSubmission,
					} = this.props;
					//	var form=JSON.parse(data);
					var form=data;
					tryUpdateCurrentForm({ form, formEndpoint });
					setCurrentFormData(this.state.payload.name, this.state.payload.doc.id, datagrid, slug);
					this.setState({
						loading: true
					})
					var load = this.state.loading == true ? 'true' : 'false';

				}

			})
	};





	renderItem = ({ item }) => (

		<Card style={{ marginHorizontal: 2, marginVertical: 10, padding: 0 }}>

			<Card.Content>
				<Placeholder
					Animation={(props) => (
						<Loader {...props}
							size="large"
							color="purple" />
					)}>

					<PlaceholderLine width={60} height={20} />
					<PlaceholderLine width={100} height={40} />



				</Placeholder>
			</Card.Content>

		</Card>
	);


	render() {
		const loading = this.state.loading;
		if (loading == false)
			return (
				<>


					<FlatList
						data={[1, 2, 3, 4, 5, 6, 7, 8, 9]}
						renderItem={this.renderItem}
						keyExtractor={item => item.id}
					/>

				</>
			);
		return (
			<ScrollView>
				<Text></Text>
				<View
					style={{
						...globalStyles.screenContainer,
						paddingBottom: 20,
					}}>
					<FormFlowWizard />
				</View>
			</ScrollView>

		);
	}

}




FormView.propTypes = {
	inAppFormName: PropTypes.string,
	navigation: PropTypes.shape({}).isRequired,
};

FormView.defaultProps = {
	inAppFormName: '',
};
const mapStateToProps = (state) => {
	let allsubmission = state.submission;
	let form55 = state.form
	return ({ allsubmission, form55 });
};
const ConnectedFormView = connect(
	mapStateToProps,
	{
		setCurrentFormData: StoreActionsForm.setCurrentFormData,
		tryUpdateCurrentForm: StoreActionsForm.tryUpdateCurrentForm,
		initializeSubmission: StoreActionsSubmission.initializeSubmission,
	},
)(FormView);

export default ConnectedFormView;
