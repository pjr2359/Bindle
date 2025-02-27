import React from 'react';
import Link from 'next/link';
import { Map } from 'lucide-react';

const Header = () => {
  return (
    <header className="bg-white shadow py-4">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex justify-between items-center">
          <Link href="/" className="flex items-center space-x-2">
            <Map className="h-8 w-8 text-blue-600" />
            <span className="text-2xl font-bold text-blue-600">Bindle</span>
          </Link>
          <nav>
            <ul className="flex space-x-6">
              <li>
                <Link href="/" className="text-gray-700 hover:text-blue-600">
                  Search
                </Link>
              </li>
              <li>
                <Link href="/trips" className="text-gray-700 hover:text-blue-600">
                  My Trips
                </Link>
              </li>
              <li>
                <Link href="/account" className="text-gray-700 hover:text-blue-600">
                  Account
                </Link>
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;