import React from 'react';
import Sidebar from './Sidebar';

const Layout = ({ children }) => {
  return (
    <div className="flex w-full h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 bg-gray-100 overflow-auto">
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
