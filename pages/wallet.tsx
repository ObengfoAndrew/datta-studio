// File: pages/wallet.tsx
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { doc, collection, getDocs } from 'firebase/firestore';
import { db } from '../src/lib/firebase';

export default function WalletPage() {
  const [folders, setFolders] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  
  // Make sure this matches the userId used in your dashboard
  const userId = 'demo-user'; // Keep this consistent across your app

  useEffect(() => {
    const fetchWalletFolders = async () => {
      try {
        console.log('Fetching wallet folders for user:', userId);
        
        const userDocRef = doc(db, 'users', userId);
        const walletRef = collection(userDocRef, 'wallet');
        const snapshot = await getDocs(walletRef);

        console.log('Snapshot size:', snapshot.size);
        console.log('Documents found:', snapshot.docs.map(doc => ({ id: doc.id, data: doc.data() })));

        if (snapshot.empty) {
          console.log('No documents found in wallet collection');
          setFolders([]);
          return;
        }

        const uniqueFolders = new Set<string>();
        snapshot.forEach((docSnap) => {
          console.log('Processing document:', docSnap.id);
          // Extract folder name from document ID
          // Assuming document IDs are like "github-repo1", "google-data", etc.
          const folderName = docSnap.id.split('-')[0];
          uniqueFolders.add(folderName);
        });

        const foldersArray = Array.from(uniqueFolders);
        console.log('Unique folders found:', foldersArray);
        setFolders(foldersArray);
      } catch (error) {
        console.error('Error fetching wallet folders:', error);
        setError('Failed to fetch wallet folders');
      } finally {
        setLoading(false);
      }
    };

    fetchWalletFolders();
  }, [userId]);

  const openFolder = (folder: string) => {
    router.push(`/wallet/${folder.toLowerCase()}`);
  };

  if (loading) {
    return (
      <div className="p-8">
        <h1 className="text-3xl font-bold mb-6">📂 My Wallet</h1>
        <p>Loading folders...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <h1 className="text-3xl font-bold mb-6">📂 My Wallet</h1>
        <p className="text-red-500">Error: {error}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">📂 My Wallet</h1>

      {folders.length === 0 ? (
        <div>
          <p>No folders yet. Connect a data source to begin.</p>
          <button 
            onClick={() => router.push('/dashboard')} 
            className="mt-4 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Go to Dashboard
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {folders.map(folder => (
            <div
              key={folder}
              onClick={() => openFolder(folder)}
              className="p-4 bg-white rounded-lg shadow hover:shadow-md cursor-pointer transition-shadow"
            >
              <h2 className="text-lg font-semibold capitalize">{folder}</h2>
              <p className="text-sm text-gray-600 mt-2">Click to view files</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}