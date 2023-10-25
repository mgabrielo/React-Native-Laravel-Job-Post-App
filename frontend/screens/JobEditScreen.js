import { KeyboardAvoidingView, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import React, { useEffect, useLayoutEffect } from 'react'
import { useNavigation, useRoute } from '@react-navigation/native'
import Spinner from 'react-native-loading-spinner-overlay';
import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import axios from 'axios';
import { format } from 'date-fns';
import DialogBox from '../components/Dialog';
import Toast from 'react-native-toast-message';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { FontAwesome5 } from '@expo/vector-icons';
import {
    newJobPostDetailFailure,
    newJobPostDetailStart,
    newJobPostDetailSuccess,
    newJobPostUpdateFailure,
    newJobPostUpdateStart,
    newJobPostUpdateSuccess
} from '../redux/newJobPost/newJobPostSlice';

const JobEditScreen = () => {
    const navigation = useNavigation();
    const route = useRoute()
    const { id } = route.params;
    const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL
    const { currentUser } = useSelector((state) => state.user)
    const { jobPostLoading, errorjobPost } = useSelector((state) => state.newJobPost)

    const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const currentDate = new Date();
    const formattedDate = format(selectedDate, 'yyyy-MM-dd');

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        salary: '',
        company: '',
        postedAt: null
    });
    const dispatch = useDispatch()
    const [isDialogVisible, setDialogVisible] = useState(false);

    useEffect(() => {
        const fetchJob = async () => {
            try {
                newJobPostDetailStart()
                const authToken = currentUser.token
                const res = await axios.get(`${BASE_URL}/api/jobs/${id}`, {
                    headers: {
                        Authorization: `Bearer ${authToken}`,
                        'Accept': 'application/json',
                        'Content-Type': 'application/json',
                    },
                })
                const data = res.data;
                if (data.status == 200) {
                    newJobPostDetailSuccess()
                    setFormData(data.jobpost)
                } else {
                    newJobPostDetailFailure(data.message)
                }
            } catch (error) {
                console.log(error)
            }
        }
        fetchJob()
    }, [id])

    useLayoutEffect(() => {
        navigation.setOptions({
            headerShown: true,
            title: 'Edit Job Post',
            headerTitleAlign: 'center',
            headerTitleStyle: {
                fontSize: 20,
                fontWeight: 'bold',
                color: '#003580',
            },
            headerStyle: {
                backgroundColor: '#fff',
                height: 100,
            },
            headerLeft: () => (
                <Pressable onPress={() => navigation.goBack()}>
                    <Text style={{ color: '#003580', fontSize: 18, fontWeight: '500' }}>Back</Text>
                </Pressable>
            ),
        })
    }, [navigation])

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (formData.title == '' || formData.description == '' || formData.company == '' || formData.salary == null) {
                Toast.show({
                    type: 'error',
                    text1: 'All fields must be Filled'
                })
                return;
            }
            dispatch(newJobPostUpdateStart())
            const authToken = currentUser.token
            await axios.put(`${BASE_URL}/api/jobs/${id}`, { ...formData, postedAt: formattedDate }, {
                headers: {
                    Authorization: `Bearer ${authToken}`,
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                },
            }).then((res) => {
                const data = res.data.jobpost;
                if (res.data.status !== 200) {
                    dispatch(newJobPostUpdateFailure(res.data.message))
                    return;
                } else {
                    Toast.show({
                        type: 'success',
                        text1: res.data.message,
                        visibilityTime: 5000
                    });
                    dispatch(newJobPostUpdateSuccess(data))
                    setFormData({})
                    navigation.navigate('JobListTab')
                }
            }).catch((err) => {
                dispatch(newJobPostUpdateFailure(err?.message))
            })

        } catch (error) {
            dispatch(newJobPostUpdateFailure('Update Error, Connect to Network and Try Again'))
            console.log(error)
        }
    }

    const hideDialog = () => {
        setDialogVisible(false);
    };

    const showDialog = () => {
        setDialogVisible(true);
    };

    const cancelJobPost = () => {
        setFormData({})
        hideDialog()
        navigation.navigate('JobListTab')
    }

    const showDatePicker = () => {
        setDatePickerVisibility(true);
    };

    const hideDatePicker = () => {
        setDatePickerVisibility(false);
    };

    const handleConfirm = (date) => {
        if (date >= currentDate) {
            setSelectedDate(date);
        }

        hideDatePicker();
    };

    return (
        <ScrollView style={styles.root} showsVerticalScrollIndicator={false}>
            <KeyboardAvoidingView style={styles.keyboardView} >
                <View style={{ marginTop: 20, gap: 5 }}>
                    <View>
                        <Text style={styles.label}>Title</Text>
                        <TextInput
                            placeholder='Enter Job Title'
                            placeholderTextColor={'#a9a9a9'}
                            value={formData.title}
                            onChangeText={(text) => setFormData({ ...formData, title: text })}
                            style={styles.input}
                        />
                    </View>
                    <View>
                        <Text style={styles.label}>Description</Text>
                        <TextInput
                            placeholder='Enter Job Description'
                            textAlign='left'
                            placeholderTextColor={'#a9a9a9'}
                            value={formData.description}
                            multiline={true}
                            numberOfLines={4}
                            textAlignVertical='top'
                            onChangeText={(text) => setFormData({ ...formData, description: text })}
                            style={styles.input}
                        />
                    </View>
                    <View>
                        <Text style={styles.label}>Salary (£) </Text>
                        <TextInput
                            placeholder='Enter Job Salary'
                            placeholderTextColor={'#a9a9a9'}
                            value={formData.salary}
                            keyboardType='numeric'
                            onChangeText={(text) => setFormData({ ...formData, salary: text })}
                            style={styles.input}
                        />
                    </View>
                    <View>
                        <Text style={styles.label}>Company Name</Text>
                        <TextInput
                            placeholder='Enter your password'
                            placeholderTextColor={'#a9a9a9'}
                            value={formData.company}
                            onChangeText={(text) => setFormData({ ...formData, company: text })}
                            style={styles.input}
                        />
                    </View>
                    <View>
                        <Text style={styles.label}>Choose Posting Date</Text>
                        <Pressable onPress={showDatePicker} style={styles.dateButton}>
                            <View style={styles.calenderView}>
                                <Text style={styles.calenderText}>
                                    {format(selectedDate, 'd-M-y')}
                                </Text>
                                <FontAwesome5 name="calendar-alt" size={24} color="#003580" />
                            </View>
                        </Pressable>

                        <DateTimePickerModal
                            isVisible={isDatePickerVisible}
                            mode="date"
                            minimumDate={currentDate}
                            onConfirm={handleConfirm}
                            onCancel={hideDatePicker}
                        />
                    </View>
                </View>
                <Pressable style={styles.button}
                    onPress={handleSubmit}
                >
                    <Spinner
                        visible={jobPostLoading}
                        color='#4682B4'
                        size={50}
                        textContent='Please Wait...'
                        textStyle={{
                            fontSize: 25,
                            color: '#003580'
                        }}
                    />
                    <Text style={styles.submitText}>
                        {jobPostLoading ? 'Updating...' : 'Update Job Post'}
                    </Text>
                </Pressable>

                <Pressable
                    style={styles.cancelPress}
                    onPress={showDialog}
                >
                    <Text style={styles.cancel}>Cancel</Text>
                </Pressable>
                {
                    isDialogVisible && (
                        <DialogBox
                            visible={isDialogVisible}
                            onClose={hideDialog}
                            message="Do You Want To Discard This Update!"
                            actionClick={cancelJobPost}
                            actionText={"Yes"}
                            actionTitle={'Cancel Job Post Update ?'}
                        />
                    )
                }
                {
                    errorjobPost && (
                        <DialogBox
                            visible={true}
                            onClose={() => dispatch(newJobPostUpdateFailure(null))}
                            message={errorjobPost}
                            actionTitle={'Job Post Error'}
                        />
                    )
                }
            </KeyboardAvoidingView>
        </ScrollView>
    )
}

export default JobEditScreen

const styles = StyleSheet.create({
    input: {
        fontSize: 17,
        borderColor: "#003580",
        borderWidth: 1.5,
        borderRadius: 5,
        marginVertical: 10,
        width: 320,
        paddingVertical: 2,
        paddingHorizontal: 10,
        textAlign: 'left',
        lineHeight: 25
    },
    button: {
        backgroundColor: 'green',
        width: 200,
        padding: 10,
        borderRadius: 5,
        marginTop: 15,
        marginBottom: 5,
        marginLeft: 'auto',
        marginRight: 'auto'
    },
    root: {
        flex: 1,
        backgroundColor: "white",
        height: '100%',
        width: '100%'
    },
    label: {
        fontSize: 18,
        fontWeight: '600'
    },
    keyboardView: {
        justifyContent: 'center',
        alignItems: 'center',
        height: '100%',
        width: '100%'
    },
    cancel: {
        fontSize: 18,
        fontWeight: '600',
        color: '#003580',
        textAlign: 'center'
    },
    cancelPress: {
        width: 200,
        marginLeft: 'auto',
        marginRight: 'auto',
        marginVertical: 7,
        padding: 8,
        borderWidth: 2,
        borderColor: '#003580',
        borderRadius: 5
    },
    submitText: {
        textAlign: 'center',
        color: 'white',
        fontSize: 18,
        fontWeight: '700'
    },
    dateButton: {
        width: '100%',
        marginVertical: 5,
        paddingVertical: 10,
        gap: 7,
        flexDirection: 'row',
        alignItems: 'center'
    },
    calenderView: {
        width: 320,
        gap: 15,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 5,
        paddingVertical: 8,
        paddingHorizontal: 15,
        flexDirection: 'row',
        borderWidth: 1.5,
        borderColor: '#003580'
    },
    calenderText: {
        fontSize: 17,
        color: '#003580'
    },
})