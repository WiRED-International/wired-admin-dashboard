import { UserLoginInterface } from "../interfaces/UserLoginInterface";

//bring in env variable for api url using vite specific import.meta


export const login = async (userInfo: UserLoginInterface) => {
  try {
    const response = await fetch(`/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }, 
      body: JSON.stringify(userInfo)
    });
    //check if response is json, if not, throw a user-readable error
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json") || !response.ok) {
        throw new Error("server error");
    }
    const data = await response.json();
    if(!response.ok) {
      throw new Error(data.message || 'Failed to log in');
    }

    return data;
  } catch(err) {
    console.error('Error from user login: ', err);
    throw err;
  }
}

export const sendPasswordResetEmail = async (email: string) => {
  try {
    const response = await fetch(`/auth/forgot-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({email})
    });
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json") || !response.ok) {
        throw new Error("server error");
    }
    const data = await response.json();
    if(!response.ok) {
      throw new Error(data.message || 'Failed to send password reset email');
    }
  } catch(err) {
    console.error('Error from sending password reset email: ', err);
    throw err;
  }
}

export const resetPassword = async (token: string, password: string) => {
  try {
    const response = await fetch(`/auth/reset-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({password, token})
    });
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json") || !response.ok) {
        throw new Error("server error");
    }
    const data = await response.json();
    if(!response.ok) {
      throw new Error(data.message || 'Failed to reset password');
    }
  } catch(err) {
    console.error('Error from resetting password: ', err);
    throw err;
  }
}

