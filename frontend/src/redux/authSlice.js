import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import jwt_decode from 'jwt-decode';
import { encryptPassword, isEncryptionSupported } from '../utils/passwordEncrypt';

// 异步操作：检查用户认证状态
export const checkAuth = createAsyncThunk(
  'auth/checkAuth',
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        return null;
      }
      
      // 验证token是否过期
      const decoded = jwt_decode(token);
      const currentTime = Date.now() / 1000;
      
      if (decoded.exp < currentTime) {
        localStorage.removeItem('token');
        return null;
      }
      
      // 获取用户信息
      const response = await axios.get('/api/v1/users/me', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      return response.data;
    } catch (error) {
      localStorage.removeItem('token');
      return rejectWithValue(error.response?.data?.detail || '认证失败');
    }
  }
);

// 异步操作：用户登录
export const login = createAsyncThunk(
  'auth/login',
  async (credentials, { rejectWithValue }) => {
    try {
      console.log('登录请求开始，原始密码:', credentials.password);
      // 加密密码
      let encryptedPassword = credentials.password;
      if (isEncryptionSupported()) {
        console.log('加密功能可用，开始加密密码');
        encryptedPassword = await encryptPassword(credentials.password);
        console.log('密码加密成功，加密结果:', encryptedPassword);
      } else {
        console.log('加密功能不可用，使用原始密码');
      }
      
      // 创建请求数据
      const requestData = {
        username: credentials.username,
        password: encryptedPassword
      };
      
      console.log('发送登录请求，数据:', requestData);
      // 发送JSON格式的请求到custom登录端点
      const response = await axios.post('/api/v1/auth/login/custom', requestData, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      const { access_token } = response.data;
      
      // 保存token到本地存储
      localStorage.setItem('token', access_token);
      
      // 获取用户信息
      const userResponse = await axios.get('/api/v1/users/me', {
        headers: {
          Authorization: `Bearer ${access_token}`
        }
      });
      
      return userResponse.data;
    } catch (error) {
      console.error('登录失败:', error);
      return rejectWithValue({
        message: error.response?.data?.detail || '登录失败',
        status: error.response?.status
      });
    }
  }
);

// 异步操作：用户注册
export const register = createAsyncThunk(
  'auth/register',
  async (userData, { rejectWithValue }) => {
    try {
      // 加密密码
      let encryptedPassword = userData.password;
      if (isEncryptionSupported()) {
        encryptedPassword = await encryptPassword(userData.password);
      }
      
      // 创建注册数据副本并替换密码
      const encryptedUserData = {
        ...userData,
        password: encryptedPassword
      };
      
      const response = await axios.post('/api/v1/auth/register', encryptedUserData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.detail || '注册失败');
    }
  }
);

// 异步操作：用户登出
export const logout = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        // 调用后端登出API
        await axios.post('/api/v1/auth/logout', { token }, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
      }
      // 无论API调用是否成功，都移除本地令牌
      localStorage.removeItem('token');
      return null;
    } catch (error) {
      // 即使API调用失败，也移除本地令牌
      localStorage.removeItem('token');
      return rejectWithValue(error.response?.data?.detail || '登出失败');
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: null,
    isAuthenticated: false,
    loading: false,
    error: null
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // 检查认证状态
      .addCase(checkAuth.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(checkAuth.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        state.isAuthenticated = !!action.payload;
      })
      .addCase(checkAuth.rejected, (state, action) => {
        state.loading = false;
        state.user = null;
        state.isAuthenticated = false;
        state.error = action.payload;
      })
      
      // 登录
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // 注册
      .addCase(register.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(register.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // 登出
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.isAuthenticated = false;
      });
  }
});

export const { clearError } = authSlice.actions;
export default authSlice.reducer;