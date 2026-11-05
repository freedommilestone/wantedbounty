'use client';
import { Link } from '../router';
import { useAuth } from './AuthProvider';
export function AccountButton(){
 const {user,loading}=useAuth();
 return <Link className="wallet-btn account-button" href={user?'/profile':'/account'}><span aria-hidden="true">♙</span>{loading?'Account':user?'My Account':'Sign Up / Log In'}</Link>;
}
