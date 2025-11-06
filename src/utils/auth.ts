import { JwtPayload, jwtDecode } from 'jwt-decode';

class AuthService {
  getProfile() {
    return jwtDecode(this.getToken());
  }

  loggedIn() {
    const token = this.getToken();
    return !!token && !this.isTokenExpired(token);
  }
  
  isTokenExpired(token: string) {
    try {
      const decoded = jwtDecode<JwtPayload>(token);
      if(decoded?.exp && decoded?.exp < Date.now() / 1000 )  {
        return true;
      }
    } catch (err) {
      return false;
    }
  }

  getToken(): string {
    const loggedUser = localStorage.getItem('id_token') || '';
    return loggedUser;
  }

  login(idToken: string) {
    localStorage.setItem('id_token', idToken);
  }

  logout() {
    localStorage.removeItem('id_token');
  }

  getRoleId(): number | null {
    const token = this.getToken();
    if (!token) return null;

    try {
      const decoded = jwtDecode<JwtPayload & { roleId?: number }>(token);
      if (typeof decoded.roleId === 'number') {
        return decoded.roleId;
      }
    } catch (err) {
      console.error('Failed to decode roleId from token:', err);
    }

    return null;
  }
}

export default new AuthService();
