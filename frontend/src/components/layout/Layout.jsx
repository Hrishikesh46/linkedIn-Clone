import React from 'react';
import Navbar from './Navbar';
import { useQuery } from '@tanstack/react-query';

const Layout = ({ children }) => {
  // so the queryKey that was used in the useQuery can be used to manage state througout the application
  const { data: authUser, isLoading } = useQuery({
    queryKey: ['authUser'],
  });

  console.log('authuser : ', authUser);

  return (
    <div className='min-h-screen bg-base-100'>
      <Navbar />
      <main className='max-w-7xl mx-auto px-4 py-6'>{children}</main>
    </div>
  );
};

export default Layout;
