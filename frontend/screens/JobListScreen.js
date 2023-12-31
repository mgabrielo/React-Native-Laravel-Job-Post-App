import { StyleSheet, View, FlatList, Text, SafeAreaView, Pressable, } from 'react-native'
import React, { useEffect, useLayoutEffect, useState } from 'react'
import { useNavigation } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons';
import JobPostItem from '../components/JobPostItem';
import axios from 'axios';
import { useDispatch, useSelector } from 'react-redux';
import { newJobPostListFailure, newJobPostListStart, newJobPostListSuccess } from '../redux/newJobPost/newJobPostSlice';
import { signOutUserStart, signOutUserSuccess, signOutUserFailure } from '../redux/user/userSlice';
import { Entypo } from '@expo/vector-icons';
import DialogBox from '../components/Dialog';
import Spinner from 'react-native-loading-spinner-overlay';
import Toast from 'react-native-toast-message';
import { persistor } from '../redux/store';

const JobListScreen = () => {
  const navigation = useNavigation();
  const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL

  const { currentUser, loading } = useSelector((state) => state.user)
  const { newJobPost, jobPostLoading } = useSelector((state) => state.newJobPost)
  const [isDialogVisible, setDialogVisible] = useState(false);
  const dispatch = useDispatch()
  const [page, setPage] = useState(1);

  useEffect(() => {
    getJobs()
  }, [])

  const getJobs = async () => {
    try {

      dispatch(newJobPostListStart())
      const authToken = currentUser.token
      const res = await axios.get(`${BASE_URL}/api/jobs?page=${page}`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        }
      })
      const data = await res.data
      if (data.status == 200) {
        dispatch(newJobPostListSuccess(data.jobpost.data));
      } else if (data.status == 404 && data?.jobpost?.data.length < 1) {
        dispatch(newJobPostListFailure())
        Toast.show({
          type: 'error',
          text1: data?.message
        })
      } else {
        dispatch(newJobPostListFailure())
      }

    } catch (error) {
      dispatch(newJobPostListFailure('Error Signing out, Connect to Network and Try Again'))
      console.log(error)
    }
  }



  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: true,
      title: 'Job List',
      headerTitleAlign: 'center',
      headerTitleStyle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: 'white',
        marginBottom: 10
      },
      headerStyle: {
        backgroundColor: '#003580',
        height: 100,
      },
      headerRight: () => (
        <Pressable style={styles.exitPress} onPress={showDialog}>
          <Text style={styles.exit}>Exit</Text>
          <Ionicons
            name="exit-outline"
            size={24}
            color="white"
            style={{ marginRight: 10, marginBottom: 10 }}
          />
        </Pressable>
      )
    })

  }, [navigation])

  const hideDialog = () => {
    setDialogVisible(false);
  };

  const showDialog = () => {
    setDialogVisible(true);
  };

  const logout = async () => {

    try {
      dispatch(signOutUserStart())
      hideDialog()
      await axios.post(`${BASE_URL}/api/logout`, null, {
        headers: {
          Authorization: `Bearer ${currentUser.token}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      }).then((res) => {
        if (res.data.status == 200) {
          dispatch(signOutUserSuccess())
          Toast.show({
            type: 'success',
            text1: res.data.message
          })
          persistor.purge()
          navigation.navigate('Login')
        }
      }).catch((err) => {
        dispatch(signOutUserFailure(err?.message))
        console.log(err)
      })
    } catch (error) {
      dispatch(signOutUserFailure('Error Signing out, Connect to Network and Try Again'))
      console.log(error.status)
    }
  }

  return (
    <SafeAreaView style={styles.page}>
      {
        isDialogVisible && (
          <DialogBox
            visible={isDialogVisible}
            onClose={hideDialog}
            message="Do you Want to Log Out!"
            actionClick={logout}
            actionText={"Log Out"}
            actionTitle={'Confirm Sign Out'}
          />
        )
      }
      {loading && (
        <Spinner
          visible={loading}
          color='#4682B4'
          size={50}
          textContent='Please Wait...'
          textStyle={{
            fontSize: 25,
            color: '#003580'
          }}
        />
      )
      }
      {
        !jobPostLoading && newJobPost && newJobPost.length > 0 ? (
          <View style={{ paddingHorizontal: 7, marginVertical: 4 }}>
            <FlatList
              data={newJobPost}
              initialNumToRender={newJobPost.length}
              keyExtractor={(item, index) => item + index}
              renderItem={({ item }) => <JobPostItem item={item} />}
              showsVerticalScrollIndicator={false}
              onEndReached={() => setPage(page + 1)}
              onEndReachedThreshold={0.1}
            />
          </View>
        ) : (

          <SafeAreaView style={styles.centerButtonContainer} >
            <Pressable style={styles.buttonContainer} onPress={() => navigation.navigate('JobCreate')}>
              <Entypo name="plus" size={24} color="#fff" />
            </Pressable>
            <Text style={styles.centerButtonText}>Add New Job Post</Text>
          </SafeAreaView>
        )

      }
    </SafeAreaView>
  )
}

export default JobListScreen

const styles = StyleSheet.create({
  page: {
    width: '100%',
    paddingHorizontal: 2,
    marginVertical: 1
  },
  exit: {
    fontSize: 14,
    fontWeight: '500',
    color: '#fff',
    textAlign: 'center',
    marginRight: 5,
    marginVertical: 4
  },
  centerButtonContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'column',
    backgroundColor: '#fff',
    gap: 15
  },
  buttonContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#003580',
    width: 50,
    height: 50,
    borderRadius: 50,
  },
  centerButtonText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#003580',
  },
  exitPress: {
    flexDirection: 'row',
    gap: 3,
    flex: 1
  }
});