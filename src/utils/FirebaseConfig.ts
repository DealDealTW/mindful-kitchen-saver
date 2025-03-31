import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { getFirestore, collection, doc, setDoc, getDoc, updateDoc, arrayUnion, arrayRemove, query, where, getDocs } from 'firebase/firestore';
import { getDatabase, ref, set, get, update, onValue } from 'firebase/database';

// Firebase 配置，實際部署時需要使用真實的配置信息
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "your-app.firebaseapp.com",
  projectId: "your-app-id",
  storageBucket: "your-app.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID",
  databaseURL: "https://your-app-id.firebaseio.com"
};

// 初始化 Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const firestore = getFirestore(app);
const database = getDatabase(app);

// Auth 相關函數
export const registerUser = async (email: string, password: string, name: string) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // 創建用戶檔案
    await setDoc(doc(firestore, 'users', user.uid), {
      name,
      email,
      createdAt: new Date().toISOString(),
      familyGroups: []
    });
    
    return { success: true, user };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

export const loginUser = async (email: string, password: string) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return { success: true, user: userCredential.user };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

export const logoutUser = async () => {
  try {
    await signOut(auth);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

export const getCurrentUser = (): User | null => {
  return auth.currentUser;
};

// 訂閱認證狀態變化
export const onAuthStateChange = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
};

// 家庭共享相關函數
export interface FamilyGroup {
  id: string;
  name: string;
  ownerId: string;
  members: string[]; // 用戶ID陣列
  readOnly: boolean;
  notifyOnChanges: boolean;
  inviteCode: string;
  createdAt: string;
}

// 創建家庭群組
export const createFamilyGroup = async (groupName: string, userId: string) => {
  try {
    // 生成6位隨機邀請碼
    const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    
    // 創建家庭群組文檔
    const groupRef = doc(collection(firestore, 'familyGroups'));
    const groupId = groupRef.id;
    
    const newGroup: FamilyGroup = {
      id: groupId,
      name: groupName,
      ownerId: userId,
      members: [userId],
      readOnly: false,
      notifyOnChanges: true,
      inviteCode,
      createdAt: new Date().toISOString()
    };
    
    await setDoc(groupRef, newGroup);
    
    // 更新用戶的家庭群組列表
    const userRef = doc(firestore, 'users', userId);
    await updateDoc(userRef, {
      familyGroups: arrayUnion(groupId)
    });
    
    return { success: true, groupId, inviteCode };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

// 加入家庭群組
export const joinFamilyGroup = async (inviteCode: string, userId: string) => {
  try {
    // 查詢具有此邀請碼的群組
    const groupsQuery = query(collection(firestore, 'familyGroups'), where('inviteCode', '==', inviteCode));
    const querySnapshot = await getDocs(groupsQuery);
    
    if (querySnapshot.empty) {
      return { success: false, error: 'Invalid invite code' };
    }
    
    // 獲取群組數據
    const groupDoc = querySnapshot.docs[0];
    const groupData = groupDoc.data() as FamilyGroup;
    const groupId = groupDoc.id;
    
    // 檢查用戶是否已經是成員
    if (groupData.members.includes(userId)) {
      return { success: false, error: 'You are already a member of this group' };
    }
    
    // 將用戶添加到成員列表
    await updateDoc(doc(firestore, 'familyGroups', groupId), {
      members: arrayUnion(userId)
    });
    
    // 更新用戶的家庭群組列表
    await updateDoc(doc(firestore, 'users', userId), {
      familyGroups: arrayUnion(groupId)
    });
    
    return { success: true, groupId };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

// 獲取用戶的所有家庭群組
export const getUserFamilyGroups = async (userId: string) => {
  try {
    const userDoc = await getDoc(doc(firestore, 'users', userId));
    if (!userDoc.exists()) {
      return { success: false, error: 'User not found' };
    }
    
    const userData = userDoc.data();
    const groupIds = userData.familyGroups || [];
    
    const groups: FamilyGroup[] = [];
    
    for (const groupId of groupIds) {
      const groupDoc = await getDoc(doc(firestore, 'familyGroups', groupId));
      if (groupDoc.exists()) {
        groups.push(groupDoc.data() as FamilyGroup);
      }
    }
    
    return { success: true, groups };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

// 離開家庭群組
export const leaveFamilyGroup = async (groupId: string, userId: string) => {
  try {
    const groupRef = doc(firestore, 'familyGroups', groupId);
    const groupDoc = await getDoc(groupRef);
    
    if (!groupDoc.exists()) {
      return { success: false, error: 'Group not found' };
    }
    
    const groupData = groupDoc.data() as FamilyGroup;
    
    // 如果用戶是群組擁有者，不允許直接離開
    if (groupData.ownerId === userId) {
      return { success: false, error: 'Group owner cannot leave. Transfer ownership or delete the group instead.' };
    }
    
    // 將用戶從成員列表中移除
    await updateDoc(groupRef, {
      members: arrayRemove(userId)
    });
    
    // 從用戶的家庭群組列表中移除此群組
    await updateDoc(doc(firestore, 'users', userId), {
      familyGroups: arrayRemove(groupId)
    });
    
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

// 同步家庭群組數據
export const syncDataWithFamilyGroup = async (groupId: string, data: any) => {
  try {
    // 將數據保存到該群組下
    await set(ref(database, `familyData/${groupId}`), data);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

// 獲取家庭群組數據
export const getFamilyGroupData = async (groupId: string) => {
  try {
    const dataSnapshot = await get(ref(database, `familyData/${groupId}`));
    if (dataSnapshot.exists()) {
      return { success: true, data: dataSnapshot.val() };
    } else {
      return { success: true, data: null };
    }
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

// 監聽家庭群組數據變化
export const onFamilyDataChange = (groupId: string, callback: (data: any) => void) => {
  const dataRef = ref(database, `familyData/${groupId}`);
  return onValue(dataRef, (snapshot) => {
    if (snapshot.exists()) {
      callback(snapshot.val());
    } else {
      callback(null);
    }
  });
};

export { auth, firestore, database }; 