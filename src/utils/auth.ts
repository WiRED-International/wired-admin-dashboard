import { JwtPayload, jwtDecode } from "jwt-decode";

export const ROLES = {
  USER: 1,
  ADMIN: 2,
  SUPER_ADMIN: 3,
  INSTRUCTOR: 4,
} as const;

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

  hasRole(...roles: number[]): boolean {
    const roleId = this.getRoleId();

    return roleId !== null && roles.includes(roleId);
  }

  isUser(): boolean {
    return this.hasRole(ROLES.USER);
  }

  isInstructor(): boolean {
    return this.hasRole(ROLES.INSTRUCTOR);
  }

  isAdmin(): boolean {
    return this.hasRole(
      ROLES.ADMIN,
      ROLES.SUPER_ADMIN
    );
  }

  isSuperAdmin(): boolean {
    return this.hasRole(
      ROLES.SUPER_ADMIN
    );
  }
}

export default new AuthService();
